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