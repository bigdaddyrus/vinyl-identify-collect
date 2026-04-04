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
 * Only extracts pressingName if it matches common pressing/edition patterns.
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
    const potentialPressing = dashMatch[3]?.trim() || '';
    // Only treat as pressingName if it matches common pressing patterns:
    // - Contains year (1970-2099)
    // - Contains pressing/edition keywords
    // - Contains country codes (UK, US, EU, etc.)
    // - Contains format keywords (Vinyl, LP, 12", etc.)
    const pressingPattern =
      /\b(19\d{2}|20\d{2})\b|pressing|edition|remaster|reissue|vinyl|limited|deluxe|\bLP\b|\bEP\b|12"|7"|\bUK\b|\bUS\b|\bEU\b|japan|import/i;
    const isPressing = pressingPattern.test(potentialPressing);

    return {
      artist: dashMatch[1].trim(),
      albumName: dashMatch[2].trim(),
      pressingName: isPressing ? potentialPressing : '',
    };
  }
  // Fallback: entire string is the album name
  return { artist: '', albumName: name.trim(), pressingName: '' };
}
