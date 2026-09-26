export interface ParsedMeetingTodo {
  title: string;
  priority: 'P1' | 'P2' | 'P3' | 'P4' | 'P5';
  assignedToName?: string;
  dueDate?: Date;
  rawText: string;
  subTasks?: { title: string; priority: 'P1' | 'P2' | 'P3' | 'P4' | 'P5'; rawText: string }[];
}

/**
 * Parses meeting notes content to extract actionable tasks.
 * Syntax rules:
 * - `#` triggers a task.
 * - `>` or `-` on following lines triggers a subtask for the preceding task.
 * - `@username` or `@Nama_Dosen` assigns the task.
 * - `p1` to `p5` (case-insensitive) designates priority. Default is `P3`.
 * - `T1` or `T1:YYYY-MM-DD` or `T1:tomorrow` specifies due date.
 */
export function parseMeetingTodos(content: string): ParsedMeetingTodo[] {
  if (!content) return [];

  // Strip HTML tags for clean text analysis while preserving line breaks
  const plainText = content
    .replace(/<br\s*[\/]?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<blockquote[^>]*>/gi, '\n> ')
    .replace(/<\/blockquote>/gi, '\n')
    .replace(/<li[^>]*>/gi, '\n- ')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\n+/g, '\n');

  const todos: ParsedMeetingTodo[] = [];
  const lines = plainText.split('\n');
  let currentTodo: ParsedMeetingTodo | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (trimmed.includes('#')) {
      const hashIndex = trimmed.indexOf('#');
      const rawSegment = trimmed.substring(hashIndex + 1).trim();
      
      let priority: 'P1' | 'P2' | 'P3' | 'P4' | 'P5' = 'P3';
      const prioMatch = rawSegment.match(/\b([pP][1-5])\b/);
      if (prioMatch) {
        priority = prioMatch[1].toUpperCase() as 'P1' | 'P2' | 'P3' | 'P4' | 'P5';
      }

      let assignedToName: string | undefined = undefined;
      const assignMatch = rawSegment.match(/@([a-zA-Z0-9_\.\-@]+)/);
      if (assignMatch) {
        assignedToName = assignMatch[1].replace(/_/g, ' ');
      }

      let dueDate: Date | undefined = undefined;
      const dueMatch = rawSegment.match(/\bT1(?::([0-9\-\:T]+))?\b/i);
      if (dueMatch) {
        if (dueMatch[1]) {
          const parsed = new Date(dueMatch[1]);
          if (!isNaN(parsed.getTime())) {
            dueDate = parsed;
          }
        }
        if (!dueDate) {
          const d = new Date();
          d.setDate(d.getDate() + 3);
          dueDate = d;
        }
      }

      let cleanTitle = rawSegment
        .replace(/\b[pP][1-5]\b/g, '')
        .replace(/@[a-zA-Z0-9_\.\-@]+/g, '')
        .replace(/\bT1(?::[^\s]+)?\b/gi, '')
        .replace(/\s+/g, ' ')
        .trim();

      if (!cleanTitle) {
        cleanTitle = rawSegment;
      }

      currentTodo = {
        title: cleanTitle,
        priority,
        assignedToName,
        dueDate,
        rawText: trimmed,
        subTasks: []
      };
      todos.push(currentTodo);
    } 
    else if (currentTodo && (trimmed.startsWith('>') || trimmed.startsWith('-'))) {
      const subTitle = trimmed.substring(1).trim();
      if (subTitle) {
        currentTodo.subTasks!.push({
          title: subTitle,
          priority: currentTodo.priority,
          rawText: trimmed
        });
      }
    } 
    else {
      // It's normal text, don't reset currentTodo just yet, in case they type normal text 
      // between subtasks, although maybe we should? Let's just ignore normal text.
    }
  }

  return todos;
}
