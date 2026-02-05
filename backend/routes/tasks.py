"""Task CRUD routes for Todo API."""

from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlmodel import Session, select

from db import get_session
from middleware.auth import CurrentUser
from models import Task

router = APIRouter(prefix="/api/{user_id}/tasks", tags=["tasks"])


# Request/Response schemas
class TaskCreate(BaseModel):
    """Schema for creating a task."""

    title: str = Field(min_length=1, max_length=200)
    description: str = Field(default="", max_length=1000)


class TaskUpdate(BaseModel):
    """Schema for updating a task."""

    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=1000)


class TaskResponse(BaseModel):
    """Schema for task response."""

    id: int
    user_id: str
    title: str
    description: str
    completed: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# Dependency type alias
SessionDep = Annotated[Session, Depends(get_session)]


def verify_user_access(url_user_id: str, token_user_id: str) -> None:
    """Verify that URL user_id matches the authenticated user from JWT."""
    if url_user_id != token_user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: user_id mismatch",
        )


def get_task_or_404(session: Session, user_id: str, task_id: int) -> Task:
    """Get task by id, ensuring it belongs to the user."""
    task = session.get(Task, task_id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )
    if task.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )
    return task


@router.get("", response_model=list[TaskResponse])
def list_tasks(user_id: str, user: CurrentUser, session: SessionDep) -> list[Task]:
    """List all tasks for a user."""
    verify_user_access(user_id, user.user_id)
    statement = select(Task).where(Task.user_id == user_id)
    tasks = session.exec(statement).all()
    return list(tasks)


@router.post("", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(
    user_id: str, task_data: TaskCreate, user: CurrentUser, session: SessionDep
) -> Task:
    """Create a new task."""
    verify_user_access(user_id, user.user_id)
    task = Task(
        user_id=user_id,
        title=task_data.title,
        description=task_data.description,
    )
    session.add(task)
    session.commit()
    session.refresh(task)
    return task


@router.get("/{task_id}", response_model=TaskResponse)
def get_task(user_id: str, task_id: int, user: CurrentUser, session: SessionDep) -> Task:
    """Get a single task by id."""
    verify_user_access(user_id, user.user_id)
    return get_task_or_404(session, user_id, task_id)


@router.put("/{task_id}", response_model=TaskResponse)
def update_task(
    user_id: str, task_id: int, task_data: TaskUpdate, user: CurrentUser, session: SessionDep
) -> Task:
    """Update a task."""
    verify_user_access(user_id, user.user_id)
    task = get_task_or_404(session, user_id, task_id)

    if task_data.title is not None:
        task.title = task_data.title
    if task_data.description is not None:
        task.description = task_data.description

    task.updated_at = datetime.utcnow()
    session.add(task)
    session.commit()
    session.refresh(task)
    return task


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(user_id: str, task_id: int, user: CurrentUser, session: SessionDep) -> None:
    """Delete a task."""
    verify_user_access(user_id, user.user_id)
    task = get_task_or_404(session, user_id, task_id)
    session.delete(task)
    session.commit()


@router.patch("/{task_id}/complete", response_model=TaskResponse)
def toggle_complete(
    user_id: str, task_id: int, user: CurrentUser, session: SessionDep
) -> Task:
    """Toggle task completion status."""
    verify_user_access(user_id, user.user_id)
    task = get_task_or_404(session, user_id, task_id)
    task.completed = not task.completed
    task.updated_at = datetime.utcnow()
    session.add(task)
    session.commit()
    session.refresh(task)
    return task
