const HTML_ENTITIES: Readonly<Record<string, string>> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#039;",
};

const HTML_CHARACTER_PATTERN = /[&<>"']/g;

export function escapeEmailHtml(value: string): string {
  return value.replace(HTML_CHARACTER_PATTERN, (character) =>
    HTML_ENTITIES[character] ?? character,
  );
}
