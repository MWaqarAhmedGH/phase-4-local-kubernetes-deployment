# Data Model: Local Kubernetes Deployment

**Feature**: 001-k8s-local-deployment
**Date**: 2025-02-05

## Overview

This document defines the infrastructure entities for the Local Kubernetes Deployment feature. Unlike traditional data models, these are infrastructure resources that will be created during deployment.

---

## Docker Images

### todo-frontend

| Attribute | Value |
|-----------|-------|
| Repository | todo-frontend |
| Tag | local |
| Base Image | node:20-alpine |
| Build Context | ./frontend |
| Exposed Port | 3000 |
| Target Size | < 500MB |

**Build Command**:
```bash
docker build -t todo-frontend:local ./frontend
```

### todo-backend

| Attribute | Value |
|-----------|-------|
| Repository | todo-backend |
| Tag | local |
| Base Image | python:3.11-slim |
| Build Context | ./backend |
| Exposed Port | 8000 |
| Target Size | < 300MB |

**Build Command**:
```bash
docker build -t todo-backend:local ./backend
```

---

## Kubernetes Resources

### Namespace

| Attribute | Value |
|-----------|-------|
| Name | default |
| Purpose | Simplicity for local dev |

*Note: Using default namespace for hackathon. Production would use dedicated namespace.*

### Deployments

#### frontend-deployment

| Attribute | Value |
|-----------|-------|
| Name | todo-frontend |
| Replicas | 1 |
| Image | todo-frontend:local |
| Image Pull Policy | Never (local build) |
| Container Port | 3000 |
| CPU Request | 100m |
| CPU Limit | 500m |
| Memory Request | 128Mi |
| Memory Limit | 512Mi |

**Environment Variables**:
| Variable | Source |
|----------|--------|
| NEXT_PUBLIC_API_URL | ConfigMap |
| BETTER_AUTH_SECRET | Secret |

**Health Checks**:
| Probe | Type | Port | Path |
|-------|------|------|------|
| Liveness | TCP | 3000 | - |
| Readiness | TCP | 3000 | - |

#### backend-deployment

| Attribute | Value |
|-----------|-------|
| Name | todo-backend |
| Replicas | 1 |
| Image | todo-backend:local |
| Image Pull Policy | Never (local build) |
| Container Port | 8000 |
| CPU Request | 100m |
| CPU Limit | 500m |
| Memory Request | 128Mi |
| Memory Limit | 512Mi |

**Environment Variables**:
| Variable | Source |
|----------|--------|
| DATABASE_URL | Secret |
| OPENAI_API_KEY | Secret |
| BETTER_AUTH_SECRET | Secret |
| FRONTEND_URL | ConfigMap |

**Health Checks**:
| Probe | Type | Port | Path |
|-------|------|------|------|
| Liveness | HTTP GET | 8000 | /health |
| Readiness | HTTP GET | 8000 | /health |

### Services

#### frontend-service

| Attribute | Value |
|-----------|-------|
| Name | todo-frontend |
| Type | NodePort |
| Port | 3000 |
| Target Port | 3000 |
| Node Port | 30080 |
| Selector | app: todo-frontend |

#### backend-service

| Attribute | Value |
|-----------|-------|
| Name | todo-backend |
| Type | ClusterIP |
| Port | 8000 |
| Target Port | 8000 |
| Selector | app: todo-backend |

*Note: Backend is ClusterIP (internal only) - accessed by frontend via service name.*

### ConfigMap

| Name | todo-config |
|------|-------------|

| Key | Description | Default Value |
|-----|-------------|---------------|
| FRONTEND_URL | Frontend service URL | http://localhost:30080 |
| BACKEND_URL | Backend internal URL | http://todo-backend:8000 |
| NEXT_PUBLIC_API_URL | API URL for frontend | http://todo-backend:8000 |

### Secret

| Name | todo-secrets |
|------|--------------|

| Key | Description | Required |
|-----|-------------|----------|
| DATABASE_URL | Neon PostgreSQL connection string | Yes |
| OPENAI_API_KEY | OpenAI API key for AI chatbot | Yes |
| BETTER_AUTH_SECRET | JWT signing secret for auth | Yes |

---

## Helm Release

| Attribute | Value |
|-----------|-------|
| Release Name | todo-chatbot |
| Chart | ./helm/todo-chatbot |
| Namespace | default |
| Version | 0.1.0 |

**Install Command**:
```bash
helm install todo-chatbot ./helm/todo-chatbot -f values-local.yaml
```

**Upgrade Command**:
```bash
helm upgrade todo-chatbot ./helm/todo-chatbot -f values-local.yaml
```

**Uninstall Command**:
```bash
helm uninstall todo-chatbot
```

---

## Resource Relationships

```
┌─────────────────────────────────────────────────────────────────┐
│                        Helm Release                              │
│                      (todo-chatbot)                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐              ┌──────────────┐                 │
│  │  ConfigMap   │              │    Secret    │                 │
│  │ (todo-config)│              │(todo-secrets)│                 │
│  └──────┬───────┘              └──────┬───────┘                 │
│         │                             │                          │
│         ▼                             ▼                          │
│  ┌─────────────────────────────────────────────────────┐        │
│  │                                                      │        │
│  │  ┌────────────────┐        ┌────────────────┐       │        │
│  │  │   Deployment   │        │   Deployment   │       │        │
│  │  │ (todo-frontend)│        │ (todo-backend) │       │        │
│  │  └───────┬────────┘        └───────┬────────┘       │        │
│  │          │                         │                 │        │
│  │          ▼                         ▼                 │        │
│  │  ┌────────────────┐        ┌────────────────┐       │        │
│  │  │     Pod        │        │     Pod        │       │        │
│  │  │ (frontend:3000)│───────▶│(backend:8000)  │       │        │
│  │  └───────┬────────┘        └───────┬────────┘       │        │
│  │          │                         │                 │        │
│  │          ▼                         ▼                 │        │
│  │  ┌────────────────┐        ┌────────────────┐       │        │
│  │  │    Service     │        │    Service     │       │        │
│  │  │   (NodePort)   │        │  (ClusterIP)   │       │        │
│  │  │  :30080→:3000  │        │  :8000→:8000   │       │        │
│  │  └────────────────┘        └────────────────┘       │        │
│  │                                                      │        │
│  └─────────────────────────────────────────────────────┘        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
                    ┌──────────────┐
                    │   Browser    │
                    │ :30080       │
                    └──────────────┘
```

---

## Validation Queries

After deployment, verify resources with:

```bash
# Check all resources
kubectl get all -l app.kubernetes.io/instance=todo-chatbot

# Check pods are running
kubectl get pods -l app.kubernetes.io/instance=todo-chatbot

# Check services
kubectl get svc todo-frontend todo-backend

# Check configmap
kubectl get configmap todo-config -o yaml

# Check secret exists (don't print values)
kubectl get secret todo-secrets

# Check pod logs
kubectl logs -l app=todo-frontend
kubectl logs -l app=todo-backend
```
