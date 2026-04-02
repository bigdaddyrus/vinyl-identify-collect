/**
 * Compose a display name from separate artist/album/pressing fields.
 * Format: "Artist — Album (Pressing)"
 */
export function composeDisplayName(
  artist?: string,
  albumName?: string,
  pressingName?: string
): string {
  if (!artist && !albumName) return 'Unknown Record';
  let display = artist || 'Unknown Artist';
  if (albumName) display += ` \u2014 ${albumName}`;
  if (pressingName) display += ` (${pressingName})`;
  return display;
}

/**
 * Parse a composed display name back into its parts.
 * Handles the "Artist — Album (Pressing)" format.
 */
export function parseDisplayName(name: string): {
  artist: string;
  albumName: string;
  pressingName: string;
} {
  // Match "Artist — Album (Pressing)" or "Artist - Album (Pressing)"
  const dashMatch = name.match(
    /^(.+?)\s*[\u2014\u2013-]\s*(.+?)(?:\s*\((.+?)\))?\s*$/
  );
  if (dashMatch) {
    return {
      artist: dashMatch[1].trim(),
      albumName: dashMatch[2].trim(),
      pressingName: dashMatch[3]?.trim() || '',
    };
  }
  // Fallback: entire string is the album name
  return { artist: '', albumName: name, pressingName: '' };
}
