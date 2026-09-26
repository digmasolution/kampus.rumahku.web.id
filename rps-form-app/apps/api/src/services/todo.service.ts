import { prisma } from './rps.service';

export interface CreateTodoInput {
  title: string;
  description?: string;
  meetingNoteId?: string;
  priority?: 'P1' | 'P2' | 'P3' | 'P4' | 'P5';
  status?: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
  dueDate?: string | null;
  assignedToId?: string | null;
  assignedToName?: string | null;
  createdById?: string | null;
  parentId?: string | null;
}

export interface UpdateTodoInput {
  title?: string;
  description?: string;
  priority?: 'P1' | 'P2' | 'P3' | 'P4' | 'P5';
  status?: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
  dueDate?: string | null;
  assignedToId?: string | null;
  assignedToName?: string | null;
  parentId?: string | null;
}

export class TodoService {
  async getAll(filters?: {
    status?: string;
    priority?: string;
    meetingNoteId?: string;
    assignedToId?: string;
  }) {
    const where: any = {};
    if (filters?.status) where.status = filters.status;
    if (filters?.priority) where.priority = filters.priority;
    if (filters?.meetingNoteId) where.meetingNoteId = filters.meetingNoteId;
    if (filters?.assignedToId) where.assignedToId = filters.assignedToId;

    return prisma.todoItem.findMany({
      where,
      orderBy: [
        { priority: 'asc' }, // P1 first, then P2, P3...
        { createdAt: 'desc' },
      ],
      include: {
        meetingNote: {
          select: { id: true, title: true, meetingDate: true },
        },
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        subTasks: {
          include: {
            assignedTo: { select: { id: true, name: true, email: true } },
            subTasks: {
              include: {
                assignedTo: { select: { id: true, name: true, email: true } },
              }
            }
          }
        },
      },
    });
  }

  async getById(id: string) {
    const item = await prisma.todoItem.findUnique({
      where: { id },
      include: {
        meetingNote: {
          select: { id: true, title: true, meetingDate: true },
        },
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        subTasks: {
          include: {
            assignedTo: { select: { id: true, name: true, email: true } },
            subTasks: {
              include: {
                assignedTo: { select: { id: true, name: true, email: true } },
              }
            }
          }
        },
      },
    });

    if (!item) {
      throw new Error(`Todo item not found: ${id}`);
    }

    return item;
  }

  async create(input: CreateTodoInput) {
    // If assignedToId provided, fetch name
    let assignedName = input.assignedToName;
    if (input.assignedToId && !assignedName) {
      const user = await prisma.user.findUnique({ where: { id: input.assignedToId } });
      if (user) assignedName = user.name;
    }

    return prisma.todoItem.create({
      data: {
        title: input.title,
        description: input.description || null,
        meetingNoteId: input.meetingNoteId || null,
        priority: input.priority || 'P3',
        status: input.status || 'TODO',
        dueDate: input.dueDate ? new Date(input.dueDate) : null,
        assignedToId: input.assignedToId || null,
        assignedToName: assignedName || null,
        createdById: input.createdById || null,
        parentId: input.parentId || null,
      },
      include: {
        meetingNote: { select: { id: true, title: true } },
        assignedTo: { select: { id: true, name: true } },
        subTasks: true,
      },
    });
  }

  async update(id: string, input: UpdateTodoInput) {
    const data: any = {};
    if (input.title !== undefined) data.title = input.title;
    if (input.description !== undefined) data.description = input.description;
    if (input.priority !== undefined) data.priority = input.priority;
    if (input.status !== undefined) data.status = input.status;
    if (input.dueDate !== undefined) {
      data.dueDate = input.dueDate ? new Date(input.dueDate) : null;
    }
    if (input.assignedToId !== undefined) {
      data.assignedToId = input.assignedToId;
      if (input.assignedToId) {
        const u = await prisma.user.findUnique({ where: { id: input.assignedToId } });
        if (u) data.assignedToName = u.name;
      } else {
        data.assignedToName = null;
      }
    }
    if (input.assignedToName !== undefined && !input.assignedToId) {
      data.assignedToName = input.assignedToName;
    }
    if (input.parentId !== undefined) {
      data.parentId = input.parentId;
    }

    return prisma.todoItem.update({
      where: { id },
      data,
      include: {
        meetingNote: { select: { id: true, title: true } },
        assignedTo: { select: { id: true, name: true } },
      },
    });
  }

  async delete(id: string) {
    return prisma.todoItem.delete({
      where: { id },
    });
  }
}

export const todoService = new TodoService();
