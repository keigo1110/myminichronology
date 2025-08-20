// WCAG 4.5:1 コントラスト比を満たすカラーパレット定義

export interface ColorPalette {
  lane: string;     // レーン背景色（淡色）
  event: string;    // イベント色（中間濃度以上）
  eventText: string; // イベントテキスト色
  name: string;     // パレット名
}

// WCAG 4.5:1 コントラスト比を満たすカラーパレット
export const accessibleColorPalettes: ColorPalette[] = [
  {
    name: 'Blue',
    lane: '#E3F2FD',     // 薄い青（Material Design Blue 50）
    event: '#1565C0',    // より濃い青（Material Design Blue 800）
    eventText: '#FFFFFF'  // 白文字
  },
  {
    name: 'Purple',
    lane: '#F3E5F5',     // 薄い紫（Material Design Purple 50）
    event: '#7B1FA2',    // 濃い紫（Material Design Purple 700）
    eventText: '#FFFFFF'  // 白文字
  },
  {
    name: 'Green',
    lane: '#E8F5E8',     // 薄い緑（Material Design Green 50）
    event: '#2E7D32',    // より濃い緑（Material Design Green 800）
    eventText: '#FFFFFF'  // 白文字
  },
  {
    name: 'Brown',
    lane: '#FFF8E1',     // 薄い茶色系（Material Design Amber 50）
    event: '#5D4037',    // 濃い茶色（Material Design Brown 700）
    eventText: '#FFFFFF'  // 白文字
  },
  {
    name: 'Pink',
    lane: '#FCE4EC',     // 薄いピンク（Material Design Pink 50）
    event: '#C2185B',    // 濃いピンク（Material Design Pink 700）
    eventText: '#FFFFFF'  // 白文字
  }
];

// Material Design カラーパレットの定義（MUIテーマで使用）
export const materialDesignColors = {
  blue: {
    50: '#E3F2FD',
    100: '#BBDEFB',
    200: '#90CAF9',
    300: '#64B5F6',
    400: '#42A5F5',
    500: '#2196F3',
    600: '#1E88E5',
    700: '#1976D2',
    800: '#1565C0',
    900: '#0D47A1'
  },
  purple: {
    50: '#F3E5F5',
    100: '#E1BEE7',
    200: '#CE93D8',
    300: '#BA68C8',
    400: '#AB47BC',
    500: '#9C27B0',
    600: '#8E24AA',
    700: '#7B1FA2',
    800: '#6A1B9A',
    900: '#4A148C'
  },
  green: {
    50: '#E8F5E8',
    100: '#C8E6C9',
    200: '#A5D6A7',
    300: '#81C784',
    400: '#66BB6A',
    500: '#4CAF50',
    600: '#43A047',
    700: '#388E3C',
    800: '#2E7D32',
    900: '#1B5E20'
  },
  brown: {
    50: '#FFF8E1',
    100: '#FFECB3',
    200: '#FFE082',
    300: '#FFD54F',
    400: '#FFCA28',
    500: '#6D4C41',
    600: '#5D4037',
    700: '#5D4037',
    800: '#4E342E',
    900: '#3E2723'
  },
  pink: {
    50: '#FCE4EC',
    100: '#F8BBD9',
    200: '#F48FB1',
    300: '#F06292',
    400: '#EC407A',
    500: '#E91E63',
    600: '#D81B60',
    700: '#C2185B',
    800: '#AD1457',
    900: '#880E4F'
  }
};

// コントラスト比計算関数
export function calculateContrastRatio(color1: string, color2: string): number {
  // ヘックスカラーをRGBに変換
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  // 相対輝度計算
  const getLuminance = (rgb: {r: number, g: number, b: number}) => {
    const sRGB = [rgb.r, rgb.g, rgb.b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
  };

  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  if (!rgb1 || !rgb2) return 0;

  const lum1 = getLuminance(rgb1);
  const lum2 = getLuminance(rgb2);

  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);

  return (brightest + 0.05) / (darkest + 0.05);
}

// パレットのアクセシビリティ検証
export function validatePaletteAccessibility(palette: ColorPalette): {
  isValid: boolean;
  contrastRatio: number;
  wcagLevel: 'AAA' | 'AA' | 'Fail';
} {
  const contrastRatio = calculateContrastRatio(palette.event, palette.eventText);

  let wcagLevel: 'AAA' | 'AA' | 'Fail';
  if (contrastRatio >= 7) {
    wcagLevel = 'AAA';
  } else if (contrastRatio >= 4.5) {
    wcagLevel = 'AA';
  } else {
    wcagLevel = 'Fail';
  }

  return {
    isValid: contrastRatio >= 4.5,
    contrastRatio: Math.round(contrastRatio * 100) / 100,
    wcagLevel
  };
}

// 使用例とテスト
if (typeof window !== 'undefined') {
  // ブラウザ環境でのみ実行
  console.log('=== カラーパレット アクセシビリティ検証 ===');
  accessibleColorPalettes.forEach(palette => {
    const validation = validatePaletteAccessibility(palette);
    console.log(`${palette.name}: ${validation.contrastRatio}:1 (${validation.wcagLevel})`);
  });
}
