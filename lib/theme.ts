// lib/theme.ts
export const colors = {
  bg: '#0b0e13',
  card: '#11161e',
  cardAlt: '#0f141b',
  outline: '#1f2630',
  text: '#ffffff',
  subtext: '#9aa0a6',
  primary: '#ff6a00',
  primary10: 'rgba(255,106,0,0.10)',
  primary15: 'rgba(255,106,0,0.15)',
  primary25: 'rgba(255,106,0,0.25)', // <-- add this
  success: '#2ecc71',
  warning: '#f1c40f',
  danger: '#ff5b5b',
};

export const radii = { sm: 8, md: 12, lg: 16, xl: 20, pill: 999 };
export const spacing = { xs: 6, sm: 10, md: 14, lg: 18, xl: 24 };
export const shadow = {
  soft: {
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 8,
  },
};
