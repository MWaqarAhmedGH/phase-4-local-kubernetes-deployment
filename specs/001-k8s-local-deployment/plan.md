# Implementation Plan: Local Kubernetes Deployment

**Branch**: `001-k8s-local-deployment` | **Date**: 2025-02-05 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-k8s-local-deployment/spec.md`

## Summary

Deploy the Phase 3 Todo AI Chatbot (Next.js frontend + FastAPI backend) to a local Kubernetes cluster using Docker containers, Minikube, and Helm charts. This involves containerizing both applications with optimized multi-stage Dockerfiles, creating a unified Helm chart for deployment, and documenting the complete deployment workflow.

## Technical Context

**Language/Version**:
- Frontend: Node.js 20 LTS, TypeScript 5.7
- Backend: Python 3.11+
- Infrastructure: Docker, Kubernetes, Helm

**Primary Dependencies**:
- Frontend: Next.js 15.1, React 19, Tailwind CSS, Better Auth
- Backend: FastAPI 0.115+, SQLModel, OpenAI SDK, PyJWT
- Infrastructure: Docker Desktop, Minikube, Helm v3/v4, kubectl

**Storage**: Neon Serverless PostgreSQL (external, accessed via connection string)

**Testing**:
- Docker: `docker build`, `docker compose up`
- Kubernetes: `kubectl get pods`, `helm test`
- Application: Health check endpoints (`/health`)

**Target Platform**: Local Kubernetes (Minikube with Docker driver) on Windows/macOS/Linux

**Project Type**: Web application (frontend + backend + infrastructure)

**Performance Goals**:
- Docker build < 5 minutes
- Pod startup < 2 minutes
- Image sizes: Frontend < 500MB, Backend < 300MB

**Constraints**:
- Minikube resource limits (2 CPU, 4GB RAM typical)
- External database access required
- No persistent volumes needed (stateless app + external DB)

**Scale/Scope**: Single replica per service, local development only

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Evidence |
|-----------|--------|----------|
| I. Spec-Driven Development | ✅ PASS | Spec created via `/sp.specify`, plan via `/sp.plan` |
| II. Container-First Architecture | ✅ PASS | Plan includes Dockerfiles for both apps, multi-stage builds |
| III. Kubernetes-Native Deployment | ✅ PASS | Helm charts with Deployments, Services, ConfigMaps, Secrets |
| IV. AI-Assisted Operations | ✅ PASS | kubectl-ai/kagent usage documented in workflow |
| V. Security and Secrets Management | ✅ PASS | Kubernetes Secrets for API keys, no hardcoded values |
| VI. Observability and Debugging | ✅ PASS | Health endpoints exist, logs to stdout, port-forward documented |

**Gate Status**: ALL PASS - Proceed to Phase 0

## Project Structure

### Documentation (this feature)

```text
specs/001-k8s-local-deployment/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output (infrastructure entities)
├── quickstart.md        # Phase 1 output (deployment guide)
├── contracts/           # Phase 1 output (Helm values schema)
└── tasks.md             # Phase 2 output (/sp.tasks)
```

### Source Code (repository root)

```text
phase-4-local-kubernetes-deployment/
├── frontend/                    # Next.js application (from Phase 3)
│   ├── app/                     # App Router pages
│   ├── components/              # React components
│   ├── lib/                     # Utilities
│   ├── Dockerfile               # Multi-stage build (NEW)
│   ├── .dockerignore            # Exclude node_modules, etc. (NEW)
│   └── package.json
│
├── backend/                     # FastAPI application (from Phase 3)
│   ├── main.py                  # Entry point with /health endpoint
│   ├── agent/                   # OpenAI agent
│   ├── mcp/                     # MCP server
│   ├── routes/                  # API routes
│   ├── Dockerfile               # Multi-stage build (NEW)
│   ├── .dockerignore            # Exclude venv, __pycache__ (NEW)
│   └── requirements.txt
│
├── helm/                        # Helm charts (NEW)
│   └── todo-chatbot/
│       ├── Chart.yaml           # Chart metadata
│       ├── values.yaml          # Default configuration
│       ├── values-dev.yaml      # Development overrides
│       └── templates/
│           ├── _helpers.tpl     # Template helpers
│           ├── frontend-deployment.yaml
│           ├── frontend-service.yaml
│           ├── backend-deployment.yaml
│           ├── backend-service.yaml
│           ├── configmap.yaml
│           └── secrets.yaml
│
├── docker-compose.yml           # Local container testing (NEW)
├── .env.example                 # Environment variable template (NEW)
└── README.md                    # Deployment documentation (UPDATE)
```

**Structure Decision**: Web application structure with separate frontend and backend directories, plus new `helm/` directory for Kubernetes deployment manifests. Docker files added to each application directory.

## Complexity Tracking

> No violations - structure aligns with constitution requirements.

| Aspect | Decision | Rationale |
|--------|----------|-----------|
| Single Helm chart | Combined frontend+backend in one chart | Simplifies deployment, applications are tightly coupled |
| NodePort vs Ingress | NodePort for local access | Simpler for Minikube, Ingress adds complexity without benefit locally |
| External database | Neon (no PVC needed) | Database already exists from Phase 3, no migration required |

---

## Phase 0: Research

### Research Tasks Completed

#### 1. Docker Multi-Stage Build Best Practices

**Decision**: Use multi-stage builds for both frontend and backend

**Rationale**:
- Reduces image size by 60-80% compared to single-stage
- Separates build dependencies from runtime
- Industry standard for production containers

**Frontend Pattern** (Next.js):
```
Stage 1: deps - Install dependencies
Stage 2: builder - Build Next.js app
Stage 3: runner - Minimal Node.js Alpine with built assets
```

**Backend Pattern** (FastAPI):
```
Stage 1: builder - Install dependencies to virtual env
Stage 2: runner - Minimal Python slim with venv copy
```

#### 2. Helm Chart Structure for Microservices

**Decision**: Single Helm chart with sub-templates for each service

**Rationale**:
- Frontend and backend are deployed together
- Shared configuration (secrets, environment)
- Simpler versioning and release management

**Alternatives Rejected**:
- Separate charts per service: Adds complexity for tightly-coupled apps
- Raw Kubernetes manifests: No templating, harder to customize

#### 3. Minikube Docker Integration

**Decision**: Use `minikube docker-env` to build images directly in Minikube's Docker daemon

**Rationale**:
- Eliminates need for image registry
- Faster iteration (no push/pull)
- Standard approach for local development

**Alternative**: Use local registry - adds complexity, not needed for hackathon

#### 4. Health Check Endpoints

**Decision**: Use existing `/health` endpoint for both liveness and readiness probes

**Rationale**:
- Backend already has `/health` returning `{"status": "healthy"}`
- Frontend Next.js serves on root, can use TCP probe
- Simple and sufficient for local deployment

#### 5. Resource Limits

**Decision**: Conservative limits suitable for Minikube

| Service | CPU Request | CPU Limit | Memory Request | Memory Limit |
|---------|-------------|-----------|----------------|--------------|
| Frontend | 100m | 500m | 128Mi | 512Mi |
| Backend | 100m | 500m | 128Mi | 512Mi |

**Rationale**: Minikube typically has 2 CPU, 4GB RAM. These limits allow both services plus system overhead.

---

## Phase 1: Design & Contracts

### Infrastructure Entities (data-model.md)

See [data-model.md](./data-model.md) for detailed entity definitions.

**Key Entities**:
1. **Docker Images**: `todo-frontend:local`, `todo-backend:local`
2. **Helm Release**: `todo-chatbot` in default namespace
3. **Kubernetes Resources**:
   - 2 Deployments (frontend, backend)
   - 2 Services (frontend-NodePort, backend-ClusterIP)
   - 1 ConfigMap (shared configuration)
   - 1 Secret (API keys, DB connection)

### Helm Values Schema (contracts/)

See [contracts/values-schema.yaml](./contracts/values-schema.yaml) for full schema.

**Key Configuration**:
```yaml
frontend:
  replicaCount: 1
  image:
    repository: todo-frontend
    tag: local
  service:
    type: NodePort
    port: 3000
    nodePort: 30080

backend:
  replicaCount: 1
  image:
    repository: todo-backend
    tag: local
  service:
    type: ClusterIP
    port: 8000

secrets:
  databaseUrl: ""          # Required: Neon connection string
  openaiApiKey: ""         # Required: OpenAI API key
  betterAuthSecret: ""     # Required: Auth secret

config:
  frontendUrl: "http://localhost:30080"
  backendUrl: "http://todo-backend:8000"
```

### Quickstart Guide (quickstart.md)

See [quickstart.md](./quickstart.md) for deployment steps.

**Summary**:
1. Prerequisites: Docker, Minikube, Helm, kubectl
2. Start Minikube: `minikube start --driver=docker`
3. Configure Docker: `eval $(minikube docker-env)`
4. Build images: `docker build -t todo-frontend:local ./frontend`
5. Create secrets: `kubectl create secret generic todo-secrets ...`
6. Deploy: `helm install todo-chatbot ./helm/todo-chatbot`
7. Access: `minikube service todo-frontend --url`

---

## Post-Design Constitution Re-Check

| Principle | Status | Post-Design Evidence |
|-----------|--------|---------------------|
| I. Spec-Driven Development | ✅ PASS | Plan complete, ready for tasks |
| II. Container-First Architecture | ✅ PASS | Multi-stage Dockerfiles designed |
| III. Kubernetes-Native Deployment | ✅ PASS | Helm chart structure defined |
| IV. AI-Assisted Operations | ✅ PASS | kubectl-ai commands in quickstart |
| V. Security and Secrets Management | ✅ PASS | K8s Secrets for all sensitive data |
| VI. Observability and Debugging | ✅ PASS | Health probes, port-forward docs |

**Final Gate Status**: ALL PASS - Ready for `/sp.tasks`

---

## Next Steps

1. Run `/sp.tasks` to generate implementation tasks
2. Execute tasks in order (Dockerfiles → docker-compose → Helm → Deploy)
3. Validate against success criteria from spec
