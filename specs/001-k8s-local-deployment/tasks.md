# Tasks: Local Kubernetes Deployment

**Input**: Design documents from `/specs/001-k8s-local-deployment/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: No explicit tests requested in spec. Validation via Docker build/run and Helm deployment.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Frontend**: `frontend/` at repository root
- **Backend**: `backend/` at repository root
- **Helm**: `helm/todo-chatbot/` at repository root
- **Root files**: Repository root (docker-compose.yml, README.md, .env.example)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create directory structure for new deployment artifacts

- [ ] T001 Create helm chart directory structure at helm/todo-chatbot/templates/
- [ ] T002 [P] Create .env.example template file at repository root

**Checkpoint**: Directory structure ready for implementation

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Verify environment and prerequisites before user story work

**⚠️ CRITICAL**: Ensure development environment is properly configured

- [ ] T003 Verify Minikube is running with `minikube status` and start if needed
- [ ] T004 Configure shell to use Minikube's Docker daemon with `minikube docker-env`

**Checkpoint**: Environment ready - user story implementation can begin

---

## Phase 3: User Story 1 - Containerize Applications (Priority: P1) 🎯 MVP

**Goal**: Package frontend and backend into Docker containers that run consistently

**Independent Test**: Build images with `docker build`, run with `docker compose up`, verify both apps respond

### Implementation for User Story 1

#### Frontend Containerization

- [ ] T005 [P] [US1] Create .dockerignore file at frontend/.dockerignore to exclude node_modules, .next, .env files
- [ ] T006 [P] [US1] Create multi-stage Dockerfile at frontend/Dockerfile with deps, builder, and runner stages
- [ ] T007 [US1] Update frontend/next.config.ts to enable standalone output mode for Docker

#### Backend Containerization

- [ ] T008 [P] [US1] Create .dockerignore file at backend/.dockerignore to exclude venv, __pycache__, .env files
- [ ] T009 [P] [US1] Create multi-stage Dockerfile at backend/Dockerfile with builder and runner stages

#### Docker Compose for Local Testing

- [ ] T010 [US1] Create docker-compose.yml at repository root with frontend and backend services
- [ ] T011 [US1] Build frontend Docker image with `docker build -t todo-frontend:local ./frontend`
- [ ] T012 [US1] Build backend Docker image with `docker build -t todo-backend:local ./backend`
- [ ] T013 [US1] Test containers locally with `docker compose up` and verify both services start
- [ ] T014 [US1] Verify image sizes meet targets (frontend < 500MB, backend < 300MB)

**Checkpoint**: Both containers build and run successfully with docker compose. MVP complete - can demo containerized app.

---

## Phase 4: User Story 2 - Deploy to Minikube with Helm (Priority: P2)

**Goal**: Deploy containerized applications to local Kubernetes using Helm charts

**Independent Test**: Run `helm install`, verify pods reach Running state, access frontend via NodePort

### Helm Chart Structure

- [ ] T015 [P] [US2] Create Chart.yaml at helm/todo-chatbot/Chart.yaml with chart metadata
- [ ] T016 [P] [US2] Create values.yaml at helm/todo-chatbot/values.yaml with default configuration
- [ ] T017 [P] [US2] Create _helpers.tpl at helm/todo-chatbot/templates/_helpers.tpl with template helpers

### Kubernetes Resource Templates

- [ ] T018 [P] [US2] Create configmap.yaml at helm/todo-chatbot/templates/configmap.yaml for non-sensitive config
- [ ] T019 [P] [US2] Create secrets.yaml at helm/todo-chatbot/templates/secrets.yaml for sensitive data
- [ ] T020 [P] [US2] Create frontend-deployment.yaml at helm/todo-chatbot/templates/frontend-deployment.yaml
- [ ] T021 [P] [US2] Create frontend-service.yaml at helm/todo-chatbot/templates/frontend-service.yaml with NodePort
- [ ] T022 [P] [US2] Create backend-deployment.yaml at helm/todo-chatbot/templates/backend-deployment.yaml
- [ ] T023 [P] [US2] Create backend-service.yaml at helm/todo-chatbot/templates/backend-service.yaml with ClusterIP

### Helm Deployment

- [ ] T024 [US2] Validate Helm chart with `helm lint ./helm/todo-chatbot`
- [ ] T025 [US2] Create values-local.yaml at helm/todo-chatbot/values-local.yaml with local secrets (gitignored)
- [ ] T026 [US2] Deploy to Minikube with `helm install todo-chatbot ./helm/todo-chatbot -f values-local.yaml`
- [ ] T027 [US2] Verify all pods reach Running state with `kubectl get pods`
- [ ] T028 [US2] Test frontend access via `minikube service todo-frontend --url`
- [ ] T029 [US2] Verify chatbot functionality - send test message and receive AI response

**Checkpoint**: Application fully deployed on Kubernetes. All pods running, services accessible, chatbot functional.

---

## Phase 5: User Story 3 - Configure Environment and Secrets (Priority: P3)

**Goal**: Ensure secrets are managed securely through Kubernetes-native mechanisms

**Independent Test**: Verify environment variables are injected into pods from Secrets/ConfigMaps

### Secret Management Verification

- [ ] T030 [US3] Verify secrets are mounted in backend pod with `kubectl exec` to check env vars
- [ ] T031 [US3] Verify configmap values are mounted in frontend pod
- [ ] T032 [US3] Confirm no secrets are visible in Docker images with `docker history`
- [ ] T033 [US3] Add values-local.yaml to .gitignore to prevent secret commits

**Checkpoint**: Secrets properly managed - no sensitive data in images or git.

---

## Phase 6: User Story 4 - Document Deployment Procedures (Priority: P4)

**Goal**: Create comprehensive documentation for deployment and troubleshooting

**Independent Test**: New person follows README and successfully deploys in under 15 minutes

### Documentation

- [ ] T034 [P] [US4] Update README.md with project overview and Phase 4 objectives
- [ ] T035 [US4] Add Prerequisites section to README.md listing Docker, Minikube, Helm, kubectl versions
- [ ] T036 [US4] Add Quick Start section to README.md with step-by-step deployment commands
- [ ] T037 [US4] Add Troubleshooting section to README.md for common issues
- [ ] T038 [US4] Add Architecture section to README.md with resource diagram
- [ ] T039 [US4] Add Cleanup section to README.md with uninstall commands

**Checkpoint**: Documentation complete - deployment reproducible by any developer.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and cleanup

- [ ] T040 Run full deployment from scratch following README.md steps
- [ ] T041 Verify all success criteria from spec.md are met
- [ ] T042 Test pod recovery by deleting a pod and verifying auto-restart
- [ ] T043 Clean up any temporary files or debug artifacts
- [ ] T044 Final commit with all Phase 4 deliverables

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1: Setup
    ↓
Phase 2: Foundational (Environment)
    ↓
Phase 3: US1 - Containerize ──────────────────┐
    ↓                                          │
Phase 4: US2 - Helm Deployment (requires US1) │
    ↓                                          │
Phase 5: US3 - Secrets (requires US2)         │
    ↓                                          │
Phase 6: US4 - Documentation (can run parallel)
    ↓
Phase 7: Polish (requires all above)
```

### User Story Dependencies

- **US1 (P1)**: No dependencies on other stories - can start after Phase 2
- **US2 (P2)**: Depends on US1 (needs Docker images to deploy)
- **US3 (P3)**: Depends on US2 (verifies secrets in running deployment)
- **US4 (P4)**: Can run in parallel with US2/US3 (documentation)

### Within User Story 1

- T005, T006 (frontend Docker files) can run in parallel
- T008, T009 (backend Docker files) can run in parallel
- T007 depends on T006 (next.config needs Dockerfile context)
- T010, T011, T012 depend on Dockerfiles being complete
- T013, T014 depend on images being built

### Within User Story 2

- T015, T016, T017 (chart metadata) can run in parallel
- T018-T023 (templates) can run in parallel
- T024 depends on all templates
- T025-T029 must run sequentially

### Parallel Opportunities

```bash
# Phase 3 - Frontend and Backend Docker files in parallel:
T005, T006  # Frontend Dockerfile + dockerignore
T008, T009  # Backend Dockerfile + dockerignore

# Phase 4 - All Helm templates in parallel:
T015, T016, T017  # Chart metadata files
T018, T019, T020, T021, T022, T023  # All template files

# Phase 6 - Documentation sections (some parallel):
T034  # README overview
T035, T036, T037, T038, T039  # README sections after T034
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1 (Containerization)
4. **STOP and VALIDATE**: Verify `docker compose up` works
5. Demo containerized application running locally

### Full Deployment

1. Complete MVP (US1)
2. Complete Phase 4: US2 (Helm + Kubernetes)
3. Complete Phase 5: US3 (Secrets verification)
4. Complete Phase 6: US4 (Documentation)
5. Complete Phase 7: Polish

### Suggested Execution Order

```
Day 1: T001-T014 (Setup + Containerization MVP)
Day 2: T015-T029 (Helm charts + Deployment)
Day 3: T030-T044 (Secrets + Docs + Polish)
```

---

## Success Criteria Mapping

| Success Criteria | Validated By |
|------------------|--------------|
| SC-001: Build images < 5 min | T011, T012 |
| SC-002: Image sizes (500MB/300MB) | T014 |
| SC-003: Pods Running < 2 min | T027 |
| SC-004: Chatbot functional | T029 |
| SC-005: Deploy in 15 min | T040 |
| SC-006: Pod auto-recovery | T042 |
| SC-007: Graceful error handling | T029 |

---

## Notes

- [P] tasks = different files, no dependencies within that phase
- [Story] label maps task to specific user story for traceability
- Always run `eval $(minikube docker-env)` before building images
- Use `imagePullPolicy: Never` in Kubernetes since images are local
- Keep values-local.yaml in .gitignore (contains secrets)
- Commit after each completed user story
