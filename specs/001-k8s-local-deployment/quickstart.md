# Quickstart: Local Kubernetes Deployment

**Feature**: 001-k8s-local-deployment
**Date**: 2025-02-05

Deploy the Todo AI Chatbot to Minikube in under 15 minutes.

---

## Prerequisites

Ensure these tools are installed:

| Tool | Version | Check Command |
|------|---------|---------------|
| Docker Desktop | Latest | `docker --version` |
| Minikube | v1.30+ | `minikube version` |
| kubectl | v1.28+ | `kubectl version --client` |
| Helm | v3.x/v4.x | `helm version` |

---

## Step 1: Start Minikube

```bash
# Start Minikube with Docker driver
minikube start --driver=docker

# Verify cluster is running
kubectl cluster-info

# Check nodes
kubectl get nodes
```

---

## Step 2: Configure Docker Environment

Point your shell to Minikube's Docker daemon so images are built inside Minikube:

```bash
# For PowerShell (Windows)
& minikube docker-env --shell powershell | Invoke-Expression

# For Bash (Linux/macOS/WSL)
eval $(minikube docker-env)

# Verify (should show minikube containers)
docker ps
```

---

## Step 3: Build Docker Images

```bash
# Build frontend image
docker build -t todo-frontend:local ./frontend

# Build backend image
docker build -t todo-backend:local ./backend

# Verify images exist
docker images | grep todo
```

Expected output:
```
todo-frontend   local   abc123   Less than a second ago   ~200MB
todo-backend    local   def456   Less than a second ago   ~150MB
```

---

## Step 4: Create Kubernetes Secrets

Create a file `values-local.yaml` (add to .gitignore):

```yaml
secrets:
  databaseUrl: "postgresql://user:password@your-neon-host/dbname?sslmode=require"
  openaiApiKey: "sk-your-openai-api-key"
  betterAuthSecret: "your-random-secret-for-jwt-signing"
```

Or create secrets directly:

```bash
kubectl create secret generic todo-secrets \
  --from-literal=DATABASE_URL="postgresql://..." \
  --from-literal=OPENAI_API_KEY="sk-..." \
  --from-literal=BETTER_AUTH_SECRET="your-secret"
```

---

## Step 5: Deploy with Helm

```bash
# Install the Helm chart
helm install todo-chatbot ./helm/todo-chatbot -f values-local.yaml

# Watch pods come up
kubectl get pods -w

# Wait for all pods to be Running (Ctrl+C to exit watch)
```

Expected output:
```
NAME                            READY   STATUS    RESTARTS   AGE
todo-frontend-abc123-xyz        1/1     Running   0          30s
todo-backend-def456-uvw         1/1     Running   0          30s
```

---

## Step 6: Access the Application

### Option A: Minikube Service (Recommended)

```bash
# Open frontend in browser
minikube service todo-frontend

# Or get the URL only
minikube service todo-frontend --url
```

### Option B: Port Forward

```bash
# Forward frontend port
kubectl port-forward svc/todo-frontend 3000:3000

# Access at http://localhost:3000
```

### Option C: Direct NodePort

```bash
# Get Minikube IP
minikube ip

# Access at http://<minikube-ip>:30080
```

---

## Step 7: Verify Deployment

```bash
# Check all resources
kubectl get all -l app.kubernetes.io/instance=todo-chatbot

# Check frontend logs
kubectl logs -l app=todo-frontend

# Check backend logs
kubectl logs -l app=todo-backend

# Check backend health
kubectl exec -it $(kubectl get pod -l app=todo-backend -o name) -- curl localhost:8000/health
```

---

## Troubleshooting

### Pods not starting

```bash
# Check pod events
kubectl describe pod <pod-name>

# Common issues:
# - ImagePullBackOff: Run `eval $(minikube docker-env)` and rebuild
# - CrashLoopBackOff: Check logs with `kubectl logs <pod-name>`
```

### Cannot connect to backend

```bash
# Check backend service
kubectl get svc todo-backend

# Test from frontend pod
kubectl exec -it $(kubectl get pod -l app=todo-frontend -o name) -- \
  wget -qO- http://todo-backend:8000/health
```

### Secret issues

```bash
# Verify secret exists
kubectl get secret todo-secrets

# Check secret is mounted
kubectl describe pod <backend-pod-name> | grep -A5 Environment
```

---

## Cleanup

```bash
# Uninstall Helm release
helm uninstall todo-chatbot

# Delete secrets (if created manually)
kubectl delete secret todo-secrets

# Stop Minikube
minikube stop

# Delete cluster (optional)
minikube delete
```

---

## AI-Assisted Operations (Optional)

If you have kubectl-ai installed:

```bash
# Deploy with AI assistance
kubectl-ai "deploy the todo chatbot with 1 replica each"

# Check cluster health
kubectl-ai "check why pods are not running"

# Scale deployment
kubectl-ai "scale todo-frontend to 2 replicas"
```

---

## Next Steps

After successful local deployment:

1. Test all chatbot functionality (add, list, complete, delete tasks)
2. Verify conversation history persists
3. Check pod recovery by deleting a pod
4. Review logs for any errors
5. Proceed to Phase 5 for cloud deployment
