/**
 * The start of a markdown text, for previews that show only a few lines of it: whole blocks (paragraphs, lists,
 * display math, …) from the beginning, until about `chars` characters of the source, and always the first block.
 * Blocks end at blank lines outside code fences and $$…$$ display math, so the excerpt renders as the text did.
 * `cut`: whether anything was left out.
 */
export function excerpt(source: string, chars: number): { text: string; cut: boolean } {
  if (source.length <= chars) return { text: source, cut: false };
  const lines = source.split("\n");
  let fence: string | null = null;
  let math = false;
  let length = 0;
  let started = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const marker = /^\s*(`{3,}|~{3,})/.exec(line)?.[1];
    if (fence) {
      if (marker && marker[0] === fence[0] && marker.length >= fence.length) fence = null;
    } else if (marker) fence = marker;
    else if ((line.match(/\$\$/g)?.length ?? 0) % 2 === 1) math = !math;
    length += line.length + 1;
    const blank = line.trim() === "";
    if (!fence && !math && blank && started && length >= chars) {
      const text = lines.slice(0, i).join("\n").trimEnd();
      return { text, cut: lines.slice(i).some((l) => l.trim() !== "") };
    }
    started ||= !blank;
  }
  return { text: source, cut: false };
}
