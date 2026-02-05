# Research: Local Kubernetes Deployment

**Feature**: 001-k8s-local-deployment
**Date**: 2025-02-05

## Research Summary

This document captures research findings for deploying the Todo AI Chatbot to local Kubernetes using Docker and Helm.

---

## 1. Docker Multi-Stage Builds

### Decision
Use multi-stage builds for both Next.js frontend and FastAPI backend.

### Rationale
- Reduces final image size by 60-80%
- Separates build-time dependencies from runtime
- Security: fewer packages = smaller attack surface
- Industry best practice for production containers

### Frontend (Next.js) Pattern

```dockerfile
# Stage 1: Install dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Stage 2: Build application
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Stage 3: Production runner
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

**Expected Size**: ~200MB (vs ~1GB single-stage)

### Backend (FastAPI) Pattern

```dockerfile
# Stage 1: Build with dependencies
FROM python:3.11-slim AS builder
WORKDIR /app
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Stage 2: Production runner
FROM python:3.11-slim AS runner
WORKDIR /app
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
COPY . .
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Expected Size**: ~150MB (vs ~500MB single-stage)

### Alternatives Considered
| Option | Pros | Cons | Decision |
|--------|------|------|----------|
| Single-stage build | Simpler Dockerfile | Large image, slow pulls | Rejected |
| Distroless images | Smallest possible | Complex debugging | Future consideration |
| Alpine base | Very small | Some compatibility issues | Used for Node.js |

---

## 2. Helm Chart Architecture

### Decision
Single Helm chart containing both frontend and backend services.

### Rationale
- Applications are tightly coupled (frontend calls backend)
- Shared secrets and configuration
- Deployed together, versioned together
- Simpler for hackathon scope

### Chart Structure
```
helm/todo-chatbot/
├── Chart.yaml           # name: todo-chatbot, version: 0.1.0
├── values.yaml          # Default values
├── values-dev.yaml      # Development overrides
└── templates/
    ├── _helpers.tpl     # Template helper functions
    ├── frontend-deployment.yaml
    ├── frontend-service.yaml
    ├── backend-deployment.yaml
    ├── backend-service.yaml
    ├── configmap.yaml
    └── secrets.yaml
```

### Alternatives Considered
| Option | Pros | Cons | Decision |
|--------|------|------|----------|
| Separate charts | Independent versioning | Over-engineered for 2 services | Rejected |
| Raw manifests | No Helm dependency | No templating, hard to customize | Rejected |
| Kustomize | Native kubectl support | Less powerful than Helm | Rejected |

---

## 3. Minikube Docker Integration

### Decision
Build images directly in Minikube's Docker daemon using `minikube docker-env`.

### Rationale
- No registry needed (simplifies local dev)
- Images available immediately to Kubernetes
- Faster build-deploy cycle
- Standard approach for Minikube development

### Workflow
```bash
# Point shell to Minikube's Docker daemon
eval $(minikube docker-env)

# Build images (now inside Minikube)
docker build -t todo-frontend:local ./frontend
docker build -t todo-backend:local ./backend

# Images are now available to Kubernetes
# Use imagePullPolicy: Never in deployments
```

### Alternatives Considered
| Option | Pros | Cons | Decision |
|--------|------|------|----------|
| Local registry | Closer to prod workflow | Adds complexity | Rejected |
| Docker Hub | Industry standard | Requires account, slower | Rejected for local dev |
| minikube image load | Works without docker-env | Slower for iteration | Backup option |

---

## 4. Service Exposure Strategy

### Decision
- Frontend: NodePort service (port 30080)
- Backend: ClusterIP service (internal only)

### Rationale
- Frontend needs external access for browser
- Backend only accessed by frontend within cluster
- NodePort simpler than LoadBalancer for Minikube
- Port 30080 avoids conflict with common ports

### Access Methods
```bash
# Method 1: Minikube service command
minikube service todo-frontend --url

# Method 2: Port forward (alternative)
kubectl port-forward svc/todo-frontend 3000:3000

# Method 3: Direct NodePort
http://$(minikube ip):30080
```

### Alternatives Considered
| Option | Pros | Cons | Decision |
|--------|------|------|----------|
| Ingress | Clean URLs | Requires ingress controller | Out of scope |
| LoadBalancer | Standard service type | Needs minikube tunnel | Overkill for local |
| Port-forward only | Simple | Manual step each time | Backup option |

---

## 5. Health Check Configuration

### Decision
Use HTTP health probes for backend, TCP probes for frontend.

### Backend Probe Configuration
```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 8000
  initialDelaySeconds: 10
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /health
    port: 8000
  initialDelaySeconds: 5
  periodSeconds: 5
```

### Frontend Probe Configuration
```yaml
livenessProbe:
  tcpSocket:
    port: 3000
  initialDelaySeconds: 10
  periodSeconds: 10

readinessProbe:
  tcpSocket:
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 5
```

### Rationale
- Backend has explicit `/health` endpoint returning JSON
- Frontend serves HTML, TCP probe sufficient
- Initial delay allows app startup
- 10s period balances responsiveness with overhead

---

## 6. Resource Limits

### Decision
Conservative limits for Minikube environment.

### Configuration
| Service | CPU Request | CPU Limit | Memory Request | Memory Limit |
|---------|-------------|-----------|----------------|--------------|
| Frontend | 100m | 500m | 128Mi | 512Mi |
| Backend | 100m | 500m | 128Mi | 512Mi |

### Rationale
- Minikube default: 2 CPU, 4GB RAM
- Leave headroom for system components
- Requests ensure scheduling
- Limits prevent runaway containers

### Alternatives Considered
| Option | Pros | Cons | Decision |
|--------|------|------|----------|
| No limits | Maximum flexibility | Risk of resource starvation | Rejected |
| Higher limits | More headroom | May not fit in Minikube | Rejected |
| Production limits | Realistic testing | Overkill for local | Future phase |

---

## 7. Secrets Management

### Decision
Use Kubernetes Secrets for sensitive data, created manually or via Helm.

### Required Secrets
| Key | Description | Source |
|-----|-------------|--------|
| DATABASE_URL | Neon PostgreSQL connection string | User provides |
| OPENAI_API_KEY | OpenAI API key for chatbot | User provides |
| BETTER_AUTH_SECRET | JWT signing secret | User generates |

### Creation Methods
```bash
# Method 1: kubectl create secret
kubectl create secret generic todo-secrets \
  --from-literal=DATABASE_URL="postgresql://..." \
  --from-literal=OPENAI_API_KEY="sk-..." \
  --from-literal=BETTER_AUTH_SECRET="your-secret"

# Method 2: Helm values (values-local.yaml)
secrets:
  databaseUrl: "postgresql://..."
  openaiApiKey: "sk-..."
  betterAuthSecret: "your-secret"
```

### Security Notes
- Never commit secrets to Git
- Use `.env.example` with placeholder values
- Document secret creation in README
- values-local.yaml in .gitignore

---

## Conclusion

All research questions resolved. Ready to proceed with:
1. data-model.md - Infrastructure entity definitions
2. contracts/ - Helm values schema
3. quickstart.md - Deployment guide
