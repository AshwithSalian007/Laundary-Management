// Light theme colors
export const LIGHT_COLORS = {
  // Primary colors - Clean Blue & White theme
  primary: '#2563EB', // Blue - representing water and cleanliness
  primaryLight: '#60A5FA',
  primaryDark: '#1E40AF',

  // Secondary colors
  secondary: '#10B981', // Green - representing freshness
  secondaryLight: '#34D399',
  secondaryDark: '#059669',

  // Status colors
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',

  // Neutral colors
  white: '#FFFFFF',
  black: '#000000',
  background: '#F9FAFB',
  surface: '#FFFFFF',
  card: '#FFFFFF',

  // Text colors
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textDisabled: '#9CA3AF',

  // Border colors
  border: '#E5E7EB',
  borderDark: '#D1D5DB',

  // Shadow
  shadow: '#000000',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.5)',
};

// Dark theme colors - Minimalist dark palette
export const DARK_COLORS = {
  // Primary colors - Slightly muted for dark mode
  primary: '#3B82F6',
  primaryLight: '#60A5FA',
  primaryDark: '#2563EB',

  // Secondary colors
  secondary: '#10B981',
  secondaryLight: '#34D399',
  secondaryDark: '#059669',

  // Status colors
  success: '#10B981',
  error: '#F87171',
  warning: '#FBBF24',
  info: '#60A5FA',

  // Neutral colors
  white: '#FFFFFF',
  black: '#000000',
  background: '#0F172A', // Deep slate background
  surface: '#1E293B', // Elevated surface
  card: '#1E293B',

  // Text colors
  textPrimary: '#F1F5F9', // Near white
  textSecondary: '#94A3B8', // Muted gray
  textDisabled: '#64748B',

  // Border colors
  border: '#334155',
  borderDark: '#475569',

  // Shadow
  shadow: '#000000',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.7)',
};

// Function to get theme colors based on mode
export const getColors = (isDark) => {
  return isDark ? DARK_COLORS : LIGHT_COLORS;
};

export const SIZES = {
  // Font sizes
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,

  // Spacing
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },

  // Border radius
  radius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },
};

export const FONTS = {
  regular: 'System',
  medium: 'System',
  bold: 'System',
  semiBold: 'System',
};
