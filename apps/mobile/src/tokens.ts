export const tokens = {
  color: {
    // Pure Black for OLED
    bg: '#000000',
    // Glassy surfaces
    surface: '#121212',
    surfaceElevated: '#1C1C1E',
    surfaceGlass: 'rgba(255, 255, 255, 0.08)',
    
    // High-contrast border
    border: '#2C2C2E',
    
    // Vibrant Accents
    primary: '#0A84FF', // Apple Blue
    accent: '#FF9F0A',  // Apple Orange (Safety Orange)
    
    // Semantic
    success: '#30D158',
    warning: '#FFD60A',
    danger: '#FF453A',
    
    // Text
    textPrimary: '#FFFFFF',
    textSecondary: '#8E8E93',
    textTertiary: '#48484A',
    textAccent: '#0A84FF',
  },
  space: {
    base: 4,
    xs: 4, 
    sm: 8, 
    mdSm: 12, 
    md: 16, 
    lg: 24, 
    xl: 32, 
    xxl: 48, 
    hero: 64,
  },
  radius: {
    xs: 4,
    sm: 10, 
    md: 14, 
    lg: 20, 
    xl: 28, 
    full: 9999,
  },
  font: {
    xs: 11, 
    sm: 13, 
    md: 16, 
    lg: 18, 
    xl: 24, 
    xxl: 32, 
    hero: 44,
  },
  // Blur intensity for glassmorphism
  blur: 20,
} as const;
