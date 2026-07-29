import { createTheme, ThemeOptions } from '@mui/material/styles';
import { materialDesignColors } from '../lib/colorPalette';

/** 紙の年表トーン（goal_design）向けアクセント — MUI 既定の青は使わない */
export const PAPER_ACCENT = '#C45C26';
export const PAPER_ACCENT_DARK = '#E07A4A';

const fontFamily =
  '"Hiragino Sans", "Hiragino Kaku Gothic ProN", "Noto Sans JP", "Yu Gothic UI", "Yu Gothic", Meiryo, system-ui, -apple-system, sans-serif';

declare module '@mui/material/styles' {
  interface Palette {
    timeline: {
      blue: typeof materialDesignColors.blue;
      purple: typeof materialDesignColors.purple;
      green: typeof materialDesignColors.green;
      brown: typeof materialDesignColors.brown;
      pink: typeof materialDesignColors.pink;
    };
    chronology: {
      hairline: string;
      hairlineStrong: string;
      grid: string;
      gridDecade: string;
      axisMuted: string;
      sheet: string;
      highlight: string;
      highlightRing: string;
    };
  }

  interface PaletteOptions {
    timeline?: Palette['timeline'];
    chronology?: Partial<Palette['chronology']>;
  }
}

function chronologyTokens(mode: 'light' | 'dark') {
  if (mode === 'dark') {
    return {
      hairline: 'rgba(255,255,255,0.12)',
      hairlineStrong: 'rgba(255,255,255,0.22)',
      grid: 'rgba(255,255,255,0.08)',
      gridDecade: 'rgba(255,255,255,0.16)',
      axisMuted: 'rgba(245,242,235,0.55)',
      sheet: '#25221E',
      highlight: PAPER_ACCENT_DARK,
      highlightRing: 'rgba(224,122,74,0.4)',
    };
  }
  return {
    hairline: 'rgba(0,0,0,0.12)',
    hairlineStrong: 'rgba(0,0,0,0.18)',
    grid: 'rgba(0,0,0,0.08)',
    gridDecade: 'rgba(0,0,0,0.18)',
    axisMuted: '#666666',
    sheet: '#FFFEFA',
    highlight: PAPER_ACCENT,
    highlightRing: 'rgba(196,92,38,0.35)',
  };
}

export function createAppTheme(mode: 'light' | 'dark') {
  const chronology = chronologyTokens(mode);
  const isDark = mode === 'dark';

  const options: ThemeOptions = {
    palette: {
      mode,
      primary: {
        main: isDark ? PAPER_ACCENT_DARK : PAPER_ACCENT,
        contrastText: '#FFFFFF',
      },
      secondary: {
        main: isDark ? '#7A9E8E' : '#1F7A6C',
      },
      background: {
        default: isDark ? '#1C1A17' : '#F7F4EE',
        paper: isDark ? '#25221E' : '#FFFEFA',
      },
      text: {
        primary: isDark ? '#F5F2EB' : '#212121',
        secondary: isDark ? 'rgba(245,242,235,0.68)' : 'rgba(33,33,33,0.62)',
      },
      divider: chronology.hairline,
      timeline: {
        blue: materialDesignColors.blue,
        purple: materialDesignColors.purple,
        green: materialDesignColors.green,
        brown: materialDesignColors.brown,
        pink: materialDesignColors.pink,
      },
      chronology,
    },
    typography: {
      fontFamily,
      button: { textTransform: 'none', fontWeight: 600 },
    },
    shape: { borderRadius: 2 },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: isDark ? '#1C1A17' : '#F7F4EE',
            color: isDark ? '#F5F2EB' : '#212121',
          },
        },
      },
      MuiPaper: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 2,
            boxShadow: 'none',
            '&:hover': { boxShadow: 'none' },
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            borderRadius: 2,
          },
        },
      },
      MuiAlert: {
        styleOverrides: {
          root: {
            borderRadius: 2,
            border: `1px solid ${chronology.hairline}`,
            alignItems: 'center',
          },
          standardWarning: {
            backgroundColor: isDark ? 'rgba(196,92,38,0.16)' : 'rgba(196,92,38,0.08)',
            color: isDark ? '#F5F2EB' : '#4A2E1A',
          },
          standardError: {
            backgroundColor: isDark ? 'rgba(179,58,58,0.2)' : 'rgba(179,58,58,0.08)',
            color: isDark ? '#F5F2EB' : '#4A1A1A',
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 2,
            fontWeight: 600,
          },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            borderRadius: 2,
            fontSize: '0.75rem',
          },
        },
      },
    },
  };

  return createTheme(options);
}
