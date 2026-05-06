import { mimidiTheme } from './mimidiTheme';

export const mimidiShadows = {
  panel: {
    borderColor: mimidiTheme.colors.border,
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.14,
    shadowRadius: 26,
    elevation: 12,
  },
  pressed: {
    borderColor: mimidiTheme.colors.borderStrong,
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
} as const;
