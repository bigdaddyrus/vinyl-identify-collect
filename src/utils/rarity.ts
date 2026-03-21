/**
 * Rarity scoring utility for collection items.
 * Maps rarity strings to numeric scores for comparison.
 */

const RARITY_ORDER: Record<string, number> = {
  'Very Common': 0,
  'Common': 1,
  'Uncommon': 2,
  'Rare': 3,
  'Very Rare': 4,
  'Extremely Rare': 5,
};

export function getRarityScore(rarity?: string): number {
  if (!rarity) return 0;
  return RARITY_ORDER[rarity] ?? 0;
}
