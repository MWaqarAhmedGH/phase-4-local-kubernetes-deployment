# Todo AI Chatbot - Phase 4: Local Kubernetes Deployment

Deploy the Todo AI Chatbot (from Phase 3) to a local Kubernetes cluster using Docker containers, Minikube, and Helm charts.

---

## Phase IV Submission Details

- **Phase IV: GitHub URL for Project Code:** [https://github.com/MWaqarAhmedGH/phase-4-local-kubernetes-deployment](https://github.com/MWaqarAhmedGH/phase-4-local-kubernetes-deployment)
- **Pull Request:** [https://github.com/MWaqarAhmedGH/phase-4-local-kubernetes-deployment/pull/1](https://github.com/MWaqarAhmedGH/phase-4-local-kubernetes-deployment/pull/1)
- **Phase IV: YouTube Demo Video:** [https://youtu.be/L6XeCHl1NK8](https://youtu.be/L6XeCHl1NK8)

---

## Run Following Commands Before Running App

```powershell
# Check if Minikube is running
minikube status

# Check if Pods are running
kubectl get pods

# Open the App in browser
minikube service todo-frontend
```

---

## Project Overview

This phase focuses on containerizing and deploying the Phase 3 AI-powered Todo Chatbot to Kubernetes:

- **Frontend**: Next.js 15 application with Better Auth integration
- **Backend**: FastAPI with OpenAI-powered AI agent
- **Infrastructure**: Docker containers, Helm charts, Minikube

## Prerequisites

Ensure the following tools are installed:

| Tool | Minimum Version | Check Command |
|------|-----------------|---------------|
| Docker Desktop | Latest | `docker --version` |
| Minikube | v1.30+ | `minikube version` |
| kubectl | v1.28+ | `kubectl version --client` |
| Helm | v3.x / v4.x | `helm version` |

## Quick Start

### 1. Start Minikube

```powershell
# Start Minikube with Docker driver
minikube start --driver=docker

# Verify cluster is running
kubectl cluster-info
kubectl get nodes
```

### 2. Configure Docker Environment

Point your shell to Minikube's Docker daemon:

```powershell
# PowerShell
& minikube docker-env --shell powershell | Invoke-Expression

# Verify (should show minikube containers)
docker ps
```

### 3. Build Docker Images

```powershell
# Build backend image
docker build -t todo-backend:local ./backend

# Build frontend image
docker build -t todo-frontend:local ./frontend

# Verify images exist
docker images | Select-String "todo-"
```

Expected output:
```
todo-frontend   local   ...   ~286MB
todo-backend    local   ...   ~248MB
```

### 4. Configure Secrets

Edit `helm/todo-chatbot/values-local.yaml` with your actual secrets:

```yaml
secrets:
  databaseUrl: "postgresql://user:password@your-neon-host.neon.tech/dbname?sslmode=require"
  openaiApiKey: "sk-your-openai-api-key"
  betterAuthSecret: "your-random-jwt-signing-secret"
```

> **Warning**: Never commit `values-local.yaml` to version control!

### 5. Deploy with Helm

```powershell
# Install the Helm chart
helm install todo-chatbot ./helm/todo-chatbot -f ./helm/todo-chatbot/values-local.yaml

# Watch pods come up
kubectl get pods -w

# Wait for all pods to be Running (Ctrl+C to exit watch)
```

Expected output:
```
NAME                                    READY   STATUS    RESTARTS   AGE
todo-chatbot-frontend-xxx               1/1     Running   0          30s
todo-chatbot-backend-xxx                1/1     Running   0          30s
```

### 6. Access the Application

```powershell
# Open frontend in browser
minikube service todo-frontend

# Or get the URL only
minikube service todo-frontend --url
```

Alternative access methods:
```powershell
# Port forward
kubectl port-forward svc/todo-frontend 3000:3000

# Direct NodePort
# Access at http://<minikube-ip>:30080
minikube ip
```

### 7. Verify Deployment

```powershell
# Check all resources
kubectl get all -l app.kubernetes.io/instance=todo-chatbot

# Check frontend logs
kubectl logs -l app=todo-frontend

# Check backend logs
kubectl logs -l app=todo-backend

# Test backend health
kubectl exec -it $(kubectl get pod -l app=todo-backend -o name | Select-Object -First 1) -- curl localhost:8000/health
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Minikube Cluster                         │
│                                                              │
│  ┌──────────────────┐        ┌──────────────────┐           │
│  │  Frontend Pod    │        │  Backend Pod     │           │
│  │  (Next.js)       │───────▶│  (FastAPI)       │           │
│  │  Port: 3000      │        │  Port: 8000      │           │
│  └────────┬─────────┘        └────────┬─────────┘           │
│           │                           │                      │
│  ┌────────▼─────────┐        ┌────────▼─────────┐           │
│  │ Frontend Service │        │ Backend Service  │           │
│  │ NodePort: 30080  │        │ ClusterIP        │           │
│  └──────────────────┘        └──────────────────┘           │
│                                                              │
│  ┌──────────────────┐        ┌──────────────────┐           │
│  │    ConfigMap     │        │     Secrets      │           │
│  │  (URLs, config)  │        │ (API keys, DB)   │           │
│  └──────────────────┘        └──────────────────┘           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │   Browser/User   │
                    │ http://...:30080 │
                    └──────────────────┘
```

## Troubleshooting

### Pods not starting

```powershell
# Check pod events
kubectl describe pod <pod-name>

# Common issues:
# - ImagePullBackOff: Run `& minikube docker-env --shell powershell | Invoke-Expression` and rebuild
# - CrashLoopBackOff: Check logs with `kubectl logs <pod-name>`
```

### Cannot connect to backend

```powershell
# Check backend service
kubectl get svc todo-backend

# Test from frontend pod
kubectl exec -it $(kubectl get pod -l app=todo-frontend -o name | Select-Object -First 1) -- wget -qO- http://todo-backend:8000/health
```

### Secret issues

```powershell
# Verify secret exists
kubectl get secret todo-secrets

# Check secret is mounted
kubectl describe pod <backend-pod-name> | Select-String -Context 0,5 "Environment"
```

### Image not found

```powershell
# Ensure you're using Minikube's Docker daemon
& minikube docker-env --shell powershell | Invoke-Expression

# Verify images are in Minikube
docker images | Select-String "todo-"

# Rebuild if necessary
docker build -t todo-backend:local ./backend
docker build -t todo-frontend:local ./frontend
```

## Cleanup

```powershell
# Uninstall Helm release
helm uninstall todo-chatbot

# Delete any remaining resources
kubectl delete configmap todo-config --ignore-not-found
kubectl delete secret todo-secrets --ignore-not-found

# Stop Minikube
minikube stop

# Delete cluster (optional)
minikube delete
```

## Project Structure

```
phase-4-local-kubernetes-deployment/
├── frontend/                    # Next.js frontend
│   ├── Dockerfile              # Multi-stage Docker build
│   ├── .dockerignore
│   └── ...
├── backend/                     # FastAPI backend
│   ├── Dockerfile              # Multi-stage Docker build
│   ├── .dockerignore
│   └── ...
├── helm/
│   └── todo-chatbot/           # Helm chart
│       ├── Chart.yaml
│       ├── values.yaml
│       ├── values-local.yaml   # Local secrets (gitignored)
│       └── templates/
│           ├── _helpers.tpl
│           ├── configmap.yaml
│           ├── secrets.yaml
│           ├── frontend-deployment.yaml
│           ├── frontend-service.yaml
│           ├── backend-deployment.yaml
│           └── backend-service.yaml
├── docker-compose.yml           # Local testing
├── .env.example                 # Environment template
└── README.md
```

## Success Criteria

| Criteria | Target | How to Verify |
|----------|--------|---------------|
| Image build time | < 5 min | Time the docker build commands |
| Frontend image size | < 500MB | `docker images \| Select-String todo-frontend` |
| Backend image size | < 300MB | `docker images \| Select-String todo-backend` |
| Pods running | < 2 min | `kubectl get pods` after helm install |
| Chatbot functional | - | Send message, receive AI response |
| Full deployment time | < 15 min | Time from start to working app |
| Pod auto-recovery | - | Delete pod, verify restart |

## Environment Variables

### Backend
| Variable | Description | Source |
|----------|-------------|--------|
| DATABASE_URL | PostgreSQL connection string | Secret |
| OPENAI_API_KEY | OpenAI API key | Secret |
| BETTER_AUTH_SECRET | JWT signing secret | Secret |
| FRONTEND_URL | Frontend URL for CORS | ConfigMap |
| PYTHONUNBUFFERED | Disable output buffering | Deployment |

### Frontend
| Variable | Description | Source |
|----------|-------------|--------|
| NODE_ENV | Node environment | Deployment |
| NEXT_PUBLIC_API_URL | Backend API URL | ConfigMap |

## Next Steps

After successful local deployment:

1. Test all chatbot functionality (add, list, complete, delete tasks)
2. Verify conversation history persists
3. Check pod recovery by deleting a pod
4. Review logs for any errors
5. Proceed to Phase 5 for cloud deployment
