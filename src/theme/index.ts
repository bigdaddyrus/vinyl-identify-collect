import { StyleSheet } from 'react-native';
import { appConfig } from '@/config/appConfig';

/**
 * Derived theme values from appConfig
 * Supports both dark and light modes based on theme.mode
 */

const { theme } = appConfig;
const isDarkMode = theme.mode === 'dark';

/** Convert a hex color (#RRGGBB) to an rgba() string at a given alpha. */
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Darken a hex color by a fraction (0 = unchanged, 1 = black). */
function darkenHex(hex: string, amount: number): string {
  const r = Math.round(parseInt(hex.slice(1, 3), 16) * (1 - amount));
  const g = Math.round(parseInt(hex.slice(3, 5), 16) * (1 - amount));
  const b = Math.round(parseInt(hex.slice(5, 7), 16) * (1 - amount));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// Legacy light mode colors (for backwards compatibility)
const lightModeColors = {
  background: theme.backgroundColor || '#FFFFFF',
  cardBackground: theme.cardBackgroundColor || '#F8F8F8',
  text: theme.textColor || '#1A1A1A',
  textSecondary: theme.secondaryTextColor || '#666666',
  primary: theme.primaryColor || '#2C5F2D',
  accent: theme.accentColor || '#D4AF37',
  border: theme.borderColor || '#E0E0E0',
};

export const colors = {
  // Backgrounds
  background: isDarkMode ? theme.backgroundPrimary : lightModeColors.background,
  backgroundSecondary: isDarkMode ? theme.backgroundSecondary : lightModeColors.cardBackground,
  backgroundTertiary: isDarkMode ? theme.backgroundTertiary : '#E0E0E0',
  cardBackground: isDarkMode ? theme.backgroundSecondary : lightModeColors.cardBackground,

  // Text
  text: isDarkMode ? theme.textPrimary : lightModeColors.text,
  textPrimary: isDarkMode ? theme.textPrimary : lightModeColors.text,
  textSecondary: isDarkMode ? theme.textSecondary : lightModeColors.textSecondary,
  textTertiary: isDarkMode ? theme.textTertiary : '#999999',

  // Accents
  primary: isDarkMode ? theme.accentPrimary : lightModeColors.primary,
  accent: isDarkMode ? theme.accentSecondary : lightModeColors.accent,
  accentPrimary: isDarkMode ? theme.accentPrimary : lightModeColors.primary,
  accentSecondary: isDarkMode ? theme.accentSecondary : lightModeColors.accent,
  accentTertiary: isDarkMode ? theme.accentTertiary : '#8A7A68',

  // Gradients
  gradientStart: isDarkMode ? theme.gradientStart : lightModeColors.primary,
  gradientEnd: isDarkMode ? theme.gradientEnd : lightModeColors.primary,
  gradientAccentStart: isDarkMode ? theme.gradientAccentStart : lightModeColors.accent,
  gradientAccentEnd: isDarkMode ? theme.gradientAccentEnd : lightModeColors.accent,

  // Semantic
  success: theme.successColor,
  error: theme.errorColor,

  // Borders
  border: isDarkMode ? theme.borderColor : lightModeColors.border,
  borderLight: isDarkMode ? theme.borderColorLight : '#F0F0F0',

  // Special
  premiumGold: theme.premiumGold,
  overlay: isDarkMode ? theme.overlayDark : 'rgba(0, 0, 0, 0.5)',

  // Constants
  white: '#FFFFFF',
  black: '#000000',

  // ── Derived surface / text / icon tokens ──────────────────
  // Transparent fills for cards and sections
  surfaceElevated: isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
  surfaceSubtle: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',

  // Semi-transparent overlays (buttons, badges, dots)
  overlayLight: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
  overlayMedium: isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.12)',

  // Reduced-emphasis text
  textMuted: isDarkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.45)',
  textBody: isDarkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',

  // Reduced-emphasis icons
  iconMuted: isDarkMode ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.45)',
  iconSubtle: isDarkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)',

  // Internal separators (lighter than border)
  borderSubtle: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',

  // Accent-derived (auto-computed from theme accent color)
  accentSurface: hexToRgba(isDarkMode ? theme.accentPrimary : (theme.primaryColor || '#2C5F2D'), 0.08),
  accentBorder: hexToRgba(isDarkMode ? theme.accentPrimary : (theme.primaryColor || '#2C5F2D'), 0.25),
  accentHighlight: hexToRgba(isDarkMode ? theme.accentPrimary : (theme.primaryColor || '#2C5F2D'), 0.12),

  // Error-derived (auto-computed from theme error color)
  errorSurface: hexToRgba(theme.errorColor, 0.15),
  errorBorderLight: hexToRgba(theme.errorColor, 0.3),

  // Bottom bar / heavy overlay
  overlayBar: isDarkMode
    ? hexToRgba(theme.backgroundPrimary, 0.85)
    : 'rgba(255,255,255,0.9)',
};

// ── Luxury gradient presets (auto-derived from accent color) ──
const accentBase = isDarkMode
  ? theme.accentPrimary
  : (theme.primaryColor || '#2C5F2D');

export const gradients = {
  /** Rich metallic gold: dark bronze edges → bright accent center.
   *  Use with LinearGradient's `colors` + `locations` props. */
  luxuryGold: [
    darkenHex(accentBase, 0.48),   // deep bronze edge
    darkenHex(accentBase, 0.22),   // rich mid-tone
    accentBase,                     // bright accent center
    darkenHex(accentBase, 0.28),   // warm mid-tone
    darkenHex(accentBase, 0.52),   // deep bronze edge
  ] as [string, string, ...string[]],
  luxuryGoldLocations: [0, 0.28, 0.52, 0.76, 1] as [number, number, ...number[]],

  /** Warm shadow color for gold buttons. */
  luxuryGoldShadow: darkenHex(accentBase, 0.55),
};

export const fonts = {
  regular: theme.fontFamily,
  price: theme.priceFontFamily,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  round: 999,
};

export const shadows = StyleSheet.create({
  small: {
    shadowColor: isDarkMode ? '#000' : '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDarkMode ? 0.3 : 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: isDarkMode ? '#000' : '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isDarkMode ? 0.4 : 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  large: {
    shadowColor: isDarkMode ? '#000' : '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: isDarkMode ? 0.5 : 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
});

export const typography = StyleSheet.create({
  h1: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
    fontFamily: fonts.regular,
  },
  h2: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    fontFamily: fonts.regular,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    fontFamily: fonts.regular,
  },
  body: {
    fontSize: 16,
    fontWeight: '400',
    color: colors.text,
    fontFamily: fonts.regular,
  },
  bodySecondary: {
    fontSize: 16,
    fontWeight: '400',
    color: colors.textSecondary,
    fontFamily: fonts.regular,
  },
  caption: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
    fontFamily: fonts.regular,
  },
  price: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.accent,
    fontFamily: fonts.price,
  },
});

// Visual feature flags
export const visualFeatures = {
  showLaurelWreaths: theme.showLaurelWreaths,
  enableGradients: theme.enableGradients,
  isDarkMode,
};
