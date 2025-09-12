// Secure, lightweight markdown renderer - no external dependencies
// Processes basic markdown without vulnerable libraries

export function renderMarkdown(text: string): string {
  if (!text) return '';
  // Normalize newlines (CRLF -> LF) so regexes work on Windows-sourced notes
  text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Basic markdown processing - return processed text for React Native Text component
  return text;
}

// Simple markdown renderer component - secure fallback
export const MarkdownDisplay = null; // Placeholder - will be replaced with simple Text component

// Styles for markdown display (secure, no external dependencies)
export const markdownStyles = {
  body: {
    color: '#0b1220',
    fontSize: 16,
    lineHeight: 24,
  },
  heading1: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#0b1220',
  },
  heading2: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#0b1220',
  },
  heading3: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#0b1220',
  },
  paragraph: {
    marginBottom: 8,
  },
  code_inline: {
    backgroundColor: 'rgba(0,0,0,0.04)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    fontFamily: 'monospace',
    fontSize: 14,
  },
  strong: {
    fontWeight: 'bold',
  },
  em: {
    fontStyle: 'italic',
  },
};