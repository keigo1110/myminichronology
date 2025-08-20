'use client';

import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { materialDesignColors } from '../lib/colorPalette';

// MUIテーマの型を拡張してカスタムカラーを追加
declare module '@mui/material/styles' {
  interface Palette {
    timeline: {
      blue: typeof materialDesignColors.blue;
      purple: typeof materialDesignColors.purple;
      green: typeof materialDesignColors.green;
      brown: typeof materialDesignColors.brown;
      pink: typeof materialDesignColors.pink;
    };
  }

  interface PaletteOptions {
    timeline?: {
      blue?: typeof materialDesignColors.blue;
      purple?: typeof materialDesignColors.purple;
      green?: typeof materialDesignColors.green;
      brown?: typeof materialDesignColors.brown;
      pink?: typeof materialDesignColors.pink;
    };
  }
}

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    background: {
      default: '#F7F7F7',
    },
    text: {
      primary: '#212121',
    },
    // タイムライン専用のカラーパレットを追加
    timeline: {
      blue: materialDesignColors.blue,
      purple: materialDesignColors.purple,
      green: materialDesignColors.green,
      brown: materialDesignColors.brown,
      pink: materialDesignColors.pink,
    },
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
  },
  components: {
    MuiContainer: {
      styleOverrides: {
        root: {
          maxWidth: '1400px !important',
        },
      },
    },
  },
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  );
}