export type CommandName =
  | 'reminder'
  | 'edit.reminder'
  | 'delete.reminder'
  | 'note'
  | 'generate'
  | 'suggest.task'
  | 'theme'
  | 'setApiKey'
  | 'setEndpoint'
  | 'setProxy'
  // v1 skips quiz feature implementation; kept for future parity
  | 'quiz'
  | 'help'
  | 'logout'
  | 'profile'
  | 'settings'
  | 'unknown';

export type ParsedCommand = {
  name: CommandName;
  raw: string;
  args: string;
};

export type CommandDef = {
  name: string;
  hint: string;
  aliases?: string[];
};

// Subset of the web COMMANDS for v1 (no quiz behavior yet)
export const COMMANDS: CommandDef[] = [
  { name: '.reminder', hint: 'Create or toggle reminders', aliases: ['r','rem','remi'] },
  { name: '.edit.reminder', hint: 'Edit an existing reminder', aliases: ['edit.reminder','er'] },
  { name: '.delete.reminder', hint: 'Delete a reminder', aliases: ['delete.reminder','dr'] },
  { name: '.note', hint: 'Open notes editor or create a note', aliases: ['n'] },
  { name: '.generate', hint: 'Generate content via AI (notes, summaries)', aliases: ['g','gen','generate'] },
  { name: '.suggest.task', hint: 'Ask AI for suggested tasks or ideas', aliases: ['suggest','sug'] },
  { name: '.theme', hint: 'Change UI theme (e.g. .theme dark)', aliases: ['t'] },
  { name: '.setApiKey', hint: 'Save API key for Gemini proxy', aliases: ['setapi','key','s'] },
  { name: '.setEndpoint', hint: 'Set Gemini endpoint', aliases: ['endpoint'] },
  { name: '.setProxy', hint: 'Set Gemini proxy', aliases: ['proxy'] },
  // keep quiz for future
  { name: '.quiz', hint: 'Start a quiz (.quiz.math)', aliases: ['q'] },
  { name: '.help', hint: 'Show available commands', aliases: ['h','?'] },
  { name: '.logout', hint: 'Logout from your account', aliases: ['l','signout'] },
  { name: '.profile', hint: 'View and edit your profile', aliases: ['p','user'] },
  { name: '.settings', hint: 'Open app settings', aliases: ['config','options'] },
];

// Normalize a leading dot-command to a canonical CommandName
export function normalizeCommandName(cmd: string): CommandName {
  const s = (cmd || '').toLowerCase().trim();
  if (s === '.reminder' || s.startsWith('.reminder ')) return 'reminder';
  if (s === '.edit.reminder' || s.startsWith('.edit.reminder ')) return 'edit.reminder';
  if (s === '.delete.reminder' || s.startsWith('.delete.reminder ')) return 'delete.reminder';
  if (s === '.note' || s.startsWith('.note ')) return 'note';
  if (s.startsWith('.generate') || s.startsWith('.gen ') || s.startsWith('.g ')) return 'generate';
  if (s.startsWith('.suggest.task')) return 'suggest.task';
  if (s.startsWith('.theme ')) return 'theme';
  if (s.startsWith('.setapikey ')) return 'setApiKey';
  if (s.startsWith('.setendpoint ')) return 'setEndpoint';
  if (s.startsWith('.setproxy ')) return 'setProxy';
  if (s.startsWith('.quiz') || s === '.quiz') return 'quiz';
  if (s === '.help' || s.startsWith('.help')) return 'help';
  if (s === '.logout' || s.startsWith('.logout') || s === '.signout' || s.startsWith('.signout')) return 'logout';
  if (s === '.profile' || s.startsWith('.profile') || s === '.user' || s.startsWith('.user')) return 'profile';
  if (s === '.settings' || s.startsWith('.settings') || s === '.config' || s.startsWith('.config')) return 'settings';
  return 'unknown';
}

// Smart parsing result for reminders
export type SmartReminderParse = {
  title: string;
  dueDate?: string;
  priority?: 'low' | 'medium' | 'high';
  recurrence?: 'daily' | 'weekly' | 'monthly';
  category?: string;
  confidence: number; // 0-1 how confident we are in the parsing
};

// Advanced natural language parsing for reminders
export function parseSmartReminder(text: string): SmartReminderParse {
  const lowerText = text.toLowerCase();
  let result: SmartReminderParse = {
    title: text,
    confidence: 0.3
  };

  // Time patterns
  const timePatterns = [
    // Today patterns
    /\btoday\s+at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i,
    /\btoday\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i,
    /\btoday\s+(\d{1,2})\s*(am|pm)/i,

    // Tomorrow patterns
    /\btomorrow\s+at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i,
    /\btomorrow\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i,
    /\btomorrow\s+(\d{1,2})\s*(am|pm)/i,

    // Day of week patterns
    /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\s+at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i,
    /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i,

    // In X time patterns
    /\bin\s+(\d+)\s+(hour|hours|minute|minutes|day|days|week|weeks)/i,
    /\bin\s+(\d+)\s+(hr|hrs|min|mins|d|w)/i,

    // Specific time patterns
    /\bat\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i,
    /(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i
  ];

  // Priority keywords
  const priorityPatterns = {
    high: /\b(urgent|important|critical|asap|emergency|high priority)\b/i,
    medium: /\b(medium|normal|standard)\b/i,
    low: /\b(low priority|whenever|eventually|sometime)\b/i
  };

  // Recurrence patterns
  const recurrencePatterns = {
    daily: /\b(every day|daily|each day)\b/i,
    weekly: /\b(every week|weekly|each week)\b/i,
    monthly: /\b(every month|monthly|each month)\b/i
  };

  // Category patterns
  const categoryPatterns = {
    work: /\b(work|meeting|presentation|deadline|project|task)\b/i,
    personal: /\b(personal|shopping|grocery|clean|laundry|appointment)\b/i,
    health: /\b(health|doctor|exercise|gym|medication|appointment)\b/i,
    study: /\b(study|exam|assignment|homework|reading|research)\b/i
  };

  // Extract due date
  for (const pattern of timePatterns) {
    const match = text.match(pattern);
    if (match) {
      // Convert to standardized format
      result.dueDate = parseTimeExpression(match, text);
      result.confidence += 0.3;
      break;
    }
  }

  // Extract priority
  for (const [priority, pattern] of Object.entries(priorityPatterns)) {
    if (pattern.test(text)) {
      result.priority = priority as 'low' | 'medium' | 'high';
      result.confidence += 0.2;
      break;
    }
  }

  // Extract recurrence
  for (const [recurrence, pattern] of Object.entries(recurrencePatterns)) {
    if (pattern.test(text)) {
      result.recurrence = recurrence as 'daily' | 'weekly' | 'monthly';
      result.confidence += 0.2;
      break;
    }
  }

  // Extract category
  for (const [category, pattern] of Object.entries(categoryPatterns)) {
    if (pattern.test(text)) {
      result.category = category;
      result.confidence += 0.1;
      break;
    }
  }

  // Clean up title by removing parsed elements
  let cleanTitle = text;
  if (result.dueDate) {
    // Remove time expressions from title
    cleanTitle = cleanTitle.replace(/\b(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\s+at\s+\d{1,2}(?::\d{2})?\s*(am|pm)?/gi, '');
    cleanTitle = cleanTitle.replace(/\b(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\s+\d{1,2}(?::\d{2})?\s*(am|pm)/gi, '');
    cleanTitle = cleanTitle.replace(/\bin\s+\d+\s+(hour|hours|minute|minutes|day|days|week|weeks|hr|hrs|min|mins|d|w)/gi, '');
    cleanTitle = cleanTitle.replace(/\bat\s+\d{1,2}(?::\d{2})?\s*(am|pm)/gi, '');
  }

  // Remove priority keywords
  cleanTitle = cleanTitle.replace(/\b(urgent|important|critical|asap|emergency|high priority|medium|normal|standard|low priority|whenever|eventually|sometime)\b/gi, '');

  // Remove recurrence keywords
  cleanTitle = cleanTitle.replace(/\b(every day|daily|each day|every week|weekly|each week|every month|monthly|each month)\b/gi, '');

  // Clean up extra spaces and punctuation
  cleanTitle = cleanTitle.replace(/\s+/g, ' ').trim();
  cleanTitle = cleanTitle.replace(/^[,.\s]+|[,.\s]+$/g, '');

  if (cleanTitle) {
    result.title = cleanTitle;
  }

  // Ensure minimum confidence
  result.confidence = Math.max(result.confidence, 0.1);

  return result;
}

// Helper function to parse time expressions
function parseTimeExpression(match: RegExpMatchArray, originalText: string): string {
  const now = new Date();

  // Handle "in X time" patterns
  if (originalText.toLowerCase().includes('in ')) {
    const amount = parseInt(match[1]);
    const unit = match[2].toLowerCase();

    switch (unit) {
      case 'hour':
      case 'hours':
      case 'hr':
      case 'hrs':
        now.setHours(now.getHours() + amount);
        break;
      case 'minute':
      case 'minutes':
      case 'min':
      case 'mins':
        now.setMinutes(now.getMinutes() + amount);
        break;
      case 'day':
      case 'days':
      case 'd':
        now.setDate(now.getDate() + amount);
        break;
      case 'week':
      case 'weeks':
      case 'w':
        now.setDate(now.getDate() + amount * 7);
        break;
    }

    return now.toLocaleString();
  }

  // Handle specific times
  let hours = parseInt(match[1]);
  const minutes = match[2] ? parseInt(match[2]) : 0;
  const ampm = match[3]?.toLowerCase();

  if (ampm === 'pm' && hours < 12) hours += 12;
  if (ampm === 'am' && hours === 12) hours = 0;

  // Handle day of week
  const dayMatch = originalText.match(/\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i);
  if (dayMatch) {
    const targetDay = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
      .indexOf(dayMatch[1].toLowerCase());
    const currentDay = now.getDay();
    const daysUntil = (targetDay - currentDay + 7) % 7;
    if (daysUntil === 0 && now.getHours() > hours) {
      // If it's today but time has passed, move to next week
      now.setDate(now.getDate() + 7);
    } else {
      now.setDate(now.getDate() + daysUntil);
    }
  } else if (originalText.toLowerCase().includes('tomorrow')) {
    now.setDate(now.getDate() + 1);
  }
  // Today is already handled by default

  now.setHours(hours, minutes, 0, 0);
  return now.toLocaleString();
}

// Parse a raw input string. If it begins with '.', treat as command; otherwise unknown (regular chat message).
export function parseCommand(raw: string): ParsedCommand {
  const trimmed = (raw || '').trim();
  if (!trimmed.startsWith('.')) return { name: 'unknown', raw, args: '' };

  const name = normalizeCommandName(trimmed);
  // Extract args after the primary command token
  let args = '';
  switch (name) {
    case 'reminder': {
      args = trimmed.slice('.reminder'.length).trim();
      break;
    }
    case 'edit.reminder': {
      args = trimmed.slice('.edit.reminder'.length).trim();
      break;
    }
    case 'delete.reminder': {
      args = trimmed.slice('.delete.reminder'.length).trim();
      break;
    }
    case 'note': {
      // e.g. ".note Title" or ".note"
      args = trimmed.slice('.note'.length).trim();
      break;
    }
    case 'generate': {
      // Align with web behavior: accept ".generate note ...", ".gen note ...", ".g note ..."
      // Strip leading ".generate" / ".gen" / ".g"
      let rest = trimmed.replace(/^(\.(?:generate|gen|g))\s*/i, '');
      // If it begins with "note", strip that token to keep parity with web
      if (rest.toLowerCase().startsWith('note')) rest = rest.slice(4).trim();
      args = rest;
      break;
    }
    case 'suggest.task': {
      args = trimmed.slice('.suggest.task'.length).trim();
      break;
    }
    case 'theme': {
      args = trimmed.slice('.theme'.length).trim();
      break;
    }
    case 'setApiKey': {
      args = trimmed.slice('.setApiKey'.length).trim();
      break;
    }
    case 'setEndpoint': {
      args = trimmed.slice('.setEndpoint'.length).trim();
      break;
    }
    case 'setProxy': {
      args = trimmed.slice('.setProxy'.length).trim();
      break;
    }
    case 'quiz': {
      args = trimmed.slice('.quiz'.length).trim();
      break;
    }
    case 'help': {
      args = trimmed.slice('.help'.length).trim();
      break;
    }
    case 'logout': {
      args = trimmed.slice('.logout'.length).trim();
      break;
    }
    case 'profile': {
      args = trimmed.slice('.profile'.length).trim();
      break;
    }
    case 'settings': {
      args = trimmed.slice('.settings'.length).trim();
      break;
    }
    default: {
      args = trimmed;
      break;
    }
  }
  return { name, raw, args };
}

// Command suggestions used for autocomplete UI
export function suggestCommands(input: string, limit = 8): CommandDef[] {
  const val = (input || '').trim();
  if (!val.startsWith('.')) return [];
  const q = val.slice(1).toLowerCase();
  const matches = COMMANDS.filter(c =>
    c.name.slice(1).toLowerCase().startsWith(q) ||
    (c.aliases || []).some(a => a.toLowerCase().startsWith(q))
  );
  return matches.slice(0, limit);
}