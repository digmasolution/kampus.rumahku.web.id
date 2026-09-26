import { Router } from 'express';
import { todoController } from '../controllers/todo.controller';

const router = Router();

router.get('/', (req, res, next) => todoController.listTodos(req, res, next));
router.post('/', (req, res, next) => todoController.createTodo(req, res, next));
router.get('/:id', (req, res, next) => todoController.getTodo(req, res, next));
router.put('/:id', (req, res, next) => todoController.updateTodo(req, res, next));
router.delete('/:id', (req, res, next) => todoController.deleteTodo(req, res, next));

export default router;
