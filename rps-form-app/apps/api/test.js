const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { parseMeetingTodos } = require('./dist/services/meetingParser.service');

async function test() {
  const content = '#Persiapan akreditasi @ajunda@uncm.ac.id p1';
  try {
    const meeting = await prisma.meetingNote.create({
      data: {
        title: 'Test',
        content: content,
        attendees: '[]',
      }
    });

    const extractedTodos = parseMeetingTodos(content);
    for (const item of extractedTodos) {
        let assignedUser = null;
        if (item.assignedToName) {
          assignedUser = await prisma.user.findFirst({
            where: {
              OR: [
                { name: { contains: item.assignedToName } },
                { email: { contains: item.assignedToName } },
              ],
            },
          });
        }

        const todo = await prisma.todoItem.create({
          data: {
            title: item.title,
            meetingNoteId: meeting.id,
            priority: item.priority,
            dueDate: item.dueDate || null,
            assignedToId: assignedUser?.id || null,
            assignedToName: item.assignedToName || assignedUser?.name || null,
          }
        });
        console.log('todo created', todo);
    }
  } catch(e) { console.error(e) }
}
test();
