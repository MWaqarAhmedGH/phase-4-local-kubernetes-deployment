"""MCP Tools for Todo task management.

These tools are used by the AI agent to manage user tasks through
natural language commands. Each tool follows MCP tool specification.
"""

from datetime import datetime
from typing import Any

from sqlmodel import Session, select

from db import get_engine
from models import Task


def _get_session() -> Session:
    """Get a database session for tool operations."""
    return Session(get_engine())


def add_task(user_id: str, title: str, description: str = "") -> dict[str, Any]:
    """
    Add a new task for the user.

    Args:
        user_id: The ID of the user creating the task
        title: The title of the task (required)
        description: Optional description of the task

    Returns:
        Dict with task details or error message
    """
    if not title or not title.strip():
        return {"success": False, "error": "Task title is required"}

    if len(title) > 200:
        return {"success": False, "error": "Task title must be 200 characters or less"}

    if len(description) > 1000:
        return {"success": False, "error": "Description must be 1000 characters or less"}

    with _get_session() as session:
        task = Task(
            user_id=user_id,
            title=title.strip(),
            description=description.strip() if description else "",
        )
        session.add(task)
        session.commit()
        session.refresh(task)

        return {
            "success": True,
            "task": {
                "id": task.id,
                "title": task.title,
                "description": task.description,
                "completed": task.completed,
                "created_at": task.created_at.isoformat(),
            },
            "message": f"Task '{task.title}' has been added successfully.",
        }


def list_tasks(
    user_id: str, include_completed: bool = True, limit: int = 50
) -> dict[str, Any]:
    """
    List tasks for a user.

    Args:
        user_id: The ID of the user
        include_completed: Whether to include completed tasks
        limit: Maximum number of tasks to return

    Returns:
        Dict with list of tasks or error message
    """
    with _get_session() as session:
        statement = select(Task).where(Task.user_id == user_id)

        if not include_completed:
            statement = statement.where(Task.completed == False)  # noqa: E712

        statement = statement.limit(limit)
        tasks = session.exec(statement).all()

        task_list = [
            {
                "id": task.id,
                "title": task.title,
                "description": task.description,
                "completed": task.completed,
                "created_at": task.created_at.isoformat(),
            }
            for task in tasks
        ]

        pending_count = sum(1 for t in task_list if not t["completed"])
        completed_count = sum(1 for t in task_list if t["completed"])

        return {
            "success": True,
            "tasks": task_list,
            "total": len(task_list),
            "pending": pending_count,
            "completed": completed_count,
            "message": f"Found {len(task_list)} task(s): {pending_count} pending, {completed_count} completed.",
        }


def complete_task(user_id: str, task_id: int) -> dict[str, Any]:
    """
    Mark a task as completed.

    Args:
        user_id: The ID of the user
        task_id: The ID of the task to complete

    Returns:
        Dict with updated task or error message
    """
    with _get_session() as session:
        task = session.get(Task, task_id)

        if not task:
            return {"success": False, "error": f"Task with ID {task_id} not found"}

        if task.user_id != user_id:
            return {"success": False, "error": "Task not found"}

        if task.completed:
            return {
                "success": True,
                "task": {
                    "id": task.id,
                    "title": task.title,
                    "completed": task.completed,
                },
                "message": f"Task '{task.title}' was already completed.",
            }

        task.completed = True
        task.updated_at = datetime.utcnow()
        session.add(task)
        session.commit()
        session.refresh(task)

        return {
            "success": True,
            "task": {
                "id": task.id,
                "title": task.title,
                "completed": task.completed,
            },
            "message": f"Task '{task.title}' has been marked as completed.",
        }


def delete_task(user_id: str, task_id: int) -> dict[str, Any]:
    """
    Delete a task.

    Args:
        user_id: The ID of the user
        task_id: The ID of the task to delete

    Returns:
        Dict with success status or error message
    """
    with _get_session() as session:
        task = session.get(Task, task_id)

        if not task:
            return {"success": False, "error": f"Task with ID {task_id} not found"}

        if task.user_id != user_id:
            return {"success": False, "error": "Task not found"}

        task_title = task.title
        session.delete(task)
        session.commit()

        return {
            "success": True,
            "deleted_task_id": task_id,
            "message": f"Task '{task_title}' has been deleted.",
        }


def update_task(
    user_id: str,
    task_id: int,
    title: str | None = None,
    description: str | None = None,
) -> dict[str, Any]:
    """
    Update a task's title and/or description.

    Args:
        user_id: The ID of the user
        task_id: The ID of the task to update
        title: New title (optional)
        description: New description (optional)

    Returns:
        Dict with updated task or error message
    """
    if title is None and description is None:
        return {"success": False, "error": "At least one field (title or description) must be provided"}

    if title is not None and len(title) > 200:
        return {"success": False, "error": "Task title must be 200 characters or less"}

    if description is not None and len(description) > 1000:
        return {"success": False, "error": "Description must be 1000 characters or less"}

    with _get_session() as session:
        task = session.get(Task, task_id)

        if not task:
            return {"success": False, "error": f"Task with ID {task_id} not found"}

        if task.user_id != user_id:
            return {"success": False, "error": "Task not found"}

        if title is not None:
            task.title = title.strip()
        if description is not None:
            task.description = description.strip()

        task.updated_at = datetime.utcnow()
        session.add(task)
        session.commit()
        session.refresh(task)

        return {
            "success": True,
            "task": {
                "id": task.id,
                "title": task.title,
                "description": task.description,
                "completed": task.completed,
                "updated_at": task.updated_at.isoformat(),
            },
            "message": f"Task '{task.title}' has been updated.",
        }


def get_all_tools() -> list[dict[str, Any]]:
    """
    Get the list of all available MCP tools with their specifications.

    Returns:
        List of tool specifications for OpenAI function calling
    """
    return [
        {
            "type": "function",
            "function": {
                "name": "add_task",
                "description": "Add a new task to the user's todo list. Use this when the user wants to create, add, or make a new task.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "title": {
                            "type": "string",
                            "description": "The title or name of the task to add",
                        },
                        "description": {
                            "type": "string",
                            "description": "Optional detailed description of the task",
                        },
                    },
                    "required": ["title"],
                },
            },
        },
        {
            "type": "function",
            "function": {
                "name": "list_tasks",
                "description": "List all tasks for the user. Use this when the user wants to see, view, show, or check their tasks or todo list.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "include_completed": {
                            "type": "boolean",
                            "description": "Whether to include completed tasks. Default is true.",
                        },
                        "limit": {
                            "type": "integer",
                            "description": "Maximum number of tasks to return. Default is 50.",
                        },
                    },
                    "required": [],
                },
            },
        },
        {
            "type": "function",
            "function": {
                "name": "complete_task",
                "description": "Mark a task as completed. Use this when the user wants to complete, finish, check off, or mark a task as done.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "task_id": {
                            "type": "integer",
                            "description": "The ID of the task to mark as completed",
                        },
                    },
                    "required": ["task_id"],
                },
            },
        },
        {
            "type": "function",
            "function": {
                "name": "delete_task",
                "description": "Delete a task from the todo list. Use this when the user wants to remove, delete, or get rid of a task.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "task_id": {
                            "type": "integer",
                            "description": "The ID of the task to delete",
                        },
                    },
                    "required": ["task_id"],
                },
            },
        },
        {
            "type": "function",
            "function": {
                "name": "update_task",
                "description": "Update a task's title or description. Use this when the user wants to edit, modify, change, or rename a task.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "task_id": {
                            "type": "integer",
                            "description": "The ID of the task to update",
                        },
                        "title": {
                            "type": "string",
                            "description": "The new title for the task",
                        },
                        "description": {
                            "type": "string",
                            "description": "The new description for the task",
                        },
                    },
                    "required": ["task_id"],
                },
            },
        },
    ]
