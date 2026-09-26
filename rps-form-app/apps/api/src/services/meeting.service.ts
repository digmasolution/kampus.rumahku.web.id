import { prisma } from './rps.service';
import { parseMeetingTodos } from './meetingParser.service';

export interface CreateMeetingInput {
  title: string;
  meetingDate?: string;
  location?: string;
  attendees?: string[] | string; // JSON array or array
  content: string;
  authorId?: string;
  autoCreateTodos?: boolean;
}

export interface UpdateMeetingInput {
  title?: string;
  meetingDate?: string;
  location?: string;
  attendees?: string[] | string;
  content?: string;
}

export class MeetingService {
  async getAll() {
    return prisma.meetingNote.findMany({
      orderBy: { meetingDate: 'desc' },
      include: {
        todos: true,
        author: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });
  }

  async getById(id: string) {
    const meeting = await prisma.meetingNote.findUnique({
      where: { id },
      include: {
        todos: {
          include: {
            assignedTo: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        author: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    if (!meeting) {
      throw new Error(`Meeting note not found for id: ${id}`);
    }

    return meeting;
  }

  async create(input: CreateMeetingInput) {
    const attendeesString = Array.isArray(input.attendees)
      ? JSON.stringify(input.attendees)
      : input.attendees || '[]';

    const meetingDate = input.meetingDate ? new Date(input.meetingDate) : new Date();

    const meeting = await prisma.meetingNote.create({
      data: {
        title: input.title,
        meetingDate,
        location: input.location || null,
        attendees: attendeesString,
        content: input.content,
        authorId: input.authorId || null,
      },
    });

    // Automatically parse # tags and generate todos if enabled
    if (input.autoCreateTodos !== false) {
      const extractedTodos = parseMeetingTodos(input.content);
      for (const item of extractedTodos) {
        // Try finding user if assignedToName matches email or name
        let assignedUser = null;
        if (item.assignedToName) {
          const isEmail = item.assignedToName.includes('@');
          
          assignedUser = await prisma.user.findFirst({
            where: isEmail
              ? { email: item.assignedToName }
              : { name: { contains: item.assignedToName } },
          });

          if (!assignedUser && !isEmail) {
            assignedUser = await prisma.user.findFirst({
              where: { email: { contains: item.assignedToName } },
            });
          }

          if (!assignedUser) {
            const namePart = isEmail ? item.assignedToName.split('@')[0] : item.assignedToName;
            const emailPart = isEmail ? item.assignedToName : `${item.assignedToName.replace(/\s+/g, '').toLowerCase()}_${Date.now()}@pending.local`;
            
            try {
              assignedUser = await prisma.user.create({
                data: {
                  name: namePart,
                  email: emailPart,
                  role: 'USER',
                  avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${namePart}`,
                },
              });
            } catch (error) {
              console.error('Failed to create shadow user for', item.assignedToName, error);
            }
          }
        }

        const parentTodo = await prisma.todoItem.create({
          data: {
            title: item.title,
            description: `Dibuat otomatis dari rapat: "${input.title}"`,
            meetingNoteId: meeting.id,
            priority: item.priority,
            status: 'TODO',
            dueDate: item.dueDate || null,
            assignedToId: assignedUser?.id || null,
            assignedToName: item.assignedToName || assignedUser?.name || null,
            createdById: input.authorId || null,
          },
        });

        // Create subtasks if any
        if (item.subTasks && item.subTasks.length > 0) {
          for (const sub of item.subTasks) {
            await prisma.todoItem.create({
              data: {
                title: sub.title,
                description: `Sub-task otomatis dari: "${item.title}"`,
                meetingNoteId: meeting.id,
                parentId: parentTodo.id,
                priority: sub.priority,
                status: 'TODO',
                dueDate: item.dueDate || null, // inherit due date
                assignedToId: assignedUser?.id || null, // inherit assignee
                assignedToName: item.assignedToName || assignedUser?.name || null,
                createdById: input.authorId || null,
              },
            });
          }
        }
      }
    }

    return this.getById(meeting.id);
  }

  async update(id: string, input: UpdateMeetingInput) {
    const updateData: any = {};
    if (input.title !== undefined) updateData.title = input.title;
    if (input.location !== undefined) updateData.location = input.location;
    if (input.content !== undefined) updateData.content = input.content;
    if (input.meetingDate !== undefined) updateData.meetingDate = new Date(input.meetingDate);
    if (input.attendees !== undefined) {
      updateData.attendees = Array.isArray(input.attendees)
        ? JSON.stringify(input.attendees)
        : input.attendees;
    }

    const updated = await prisma.meetingNote.update({
      where: { id },
      data: updateData,
    });

    return this.getById(updated.id);
  }

  async delete(id: string) {
    return prisma.meetingNote.delete({
      where: { id },
    });
  }
}

export const meetingService = new MeetingService();
