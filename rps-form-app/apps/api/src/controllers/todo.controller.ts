import { Request, Response, NextFunction } from 'express';
import { todoService } from '../services/todo.service';

export class TodoController {
  async listTodos(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, priority, meetingNoteId, assignedToId } = req.query;
      const todos = await todoService.getAll({
        status: typeof status === 'string' ? status : undefined,
        priority: typeof priority === 'string' ? priority : undefined,
        meetingNoteId: typeof meetingNoteId === 'string' ? meetingNoteId : undefined,
        assignedToId: typeof assignedToId === 'string' ? assignedToId : undefined,
      });
      res.json(todos);
    } catch (err) {
      next(err);
    }
  }

  async getTodo(req: Request, res: Response, next: NextFunction) {
    try {
      const todo = await todoService.getById(req.params.id);
      res.json(todo);
    } catch (err) {
      next(err);
    }
  }

  async createTodo(req: Request, res: Response, next: NextFunction) {
    try {
      const { title, description, meetingNoteId, priority, status, dueDate, assignedToId, assignedToName, createdById, parentId } = req.body;
      if (!title) {
        return res.status(400).json({ error: 'Title is required' });
      }

      const todo = await todoService.create({
        title,
        description,
        meetingNoteId,
        priority,
        status,
        dueDate,
        assignedToId,
        assignedToName,
        createdById,
        parentId,
      });

      res.status(201).json(todo);
    } catch (err) {
      next(err);
    }
  }

  async updateTodo(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await todoService.update(req.params.id, req.body);
      res.json(updated);
    } catch (err) {
      next(err);
    }
  }

  async deleteTodo(req: Request, res: Response, next: NextFunction) {
    try {
      await todoService.delete(req.params.id);
      res.json({ success: true, message: 'Todo item deleted' });
    } catch (err) {
      next(err);
    }
  }
}

export const todoController = new TodoController();
