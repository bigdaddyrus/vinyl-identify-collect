import { z } from 'zod';

export const analysisResponseSchema = z.object({
  name: z.string().default('Unknown Record'),
  origin: z.string().default('Unknown'),
  year: z.string().default('Unknown'),
  estimatedValue: z.coerce.number().default(0),
  estimatedValueLow: z.coerce.number().optional(),
  estimatedValueHigh: z.coerce.number().optional(),
  confidence: z.coerce.number().min(0).max(100).default(0),
  rarity: z.string().optional(),
  label: z.string().optional(),
  genre: z.string().optional(),
  condition: z.string().optional(),
  album_art_query: z.string().optional(),
  description: z.string().default('No description available.'),
  extendedDetails: z
    .array(
      z.object({
        title: z.string(),
        icon: z.string().optional(),
        items: z.array(z.object({ label: z.string(), value: z.string() })),
      })
    )
    .optional(),
});

export type AnalysisResponse = z.infer<typeof analysisResponseSchema>;
