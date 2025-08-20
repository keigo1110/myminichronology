import { describe, expect, it } from 'vitest';
import {
  accessibleColorPalettes,
  calculateContrastRatio,
  validatePaletteAccessibility,
  materialDesignColors
} from '../lib/colorPalette';

describe('Color Palette Accessibility', () => {
  describe('calculateContrastRatio', () => {
    it('should calculate correct contrast ratios for known colors', () => {
      // 白と黒の最大コントラスト比
      const whiteBlackRatio = calculateContrastRatio('#FFFFFF', '#000000');
      expect(whiteBlackRatio).toBeCloseTo(21, 1);

      // 同じ色のコントラスト比は1
      const sameColorRatio = calculateContrastRatio('#FF0000', '#FF0000');
      expect(sameColorRatio).toBe(1);
    });

    it('should handle invalid hex colors gracefully', () => {
      const invalidRatio = calculateContrastRatio('invalid', '#000000');
      expect(invalidRatio).toBe(0);
    });
  });

  describe('validatePaletteAccessibility', () => {
    it('should validate all predefined palettes meet WCAG AA standards', () => {
      accessibleColorPalettes.forEach(palette => {
        const validation = validatePaletteAccessibility(palette);

        expect(validation.isValid).toBe(true);
        expect(validation.contrastRatio).toBeGreaterThanOrEqual(4.5);
        expect(['AA', 'AAA']).toContain(validation.wcagLevel);

        console.log(`${palette.name}: ${validation.contrastRatio}:1 (${validation.wcagLevel})`);
      });
    });

    it('should correctly identify failing contrast ratios', () => {
      const badPalette = {
        name: 'Bad Contrast',
        lane: '#E3F2FD',
        event: '#BBDEFB', // 薄い色同士でコントラストが低い
        eventText: '#90CAF9'
      };

      const validation = validatePaletteAccessibility(badPalette);
      expect(validation.isValid).toBe(false);
      expect(validation.wcagLevel).toBe('Fail');
    });
  });

  describe('Material Design Colors', () => {
    it('should have consistent color structure', () => {
      const colorKeys = ['blue', 'purple', 'green', 'brown', 'pink'];
      const shadeKeys = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900'];

      colorKeys.forEach(colorKey => {
        const colorSet = materialDesignColors[colorKey as keyof typeof materialDesignColors];
        expect(colorSet).toBeDefined();

        shadeKeys.forEach(shade => {
          expect(colorSet[shade as keyof typeof colorSet]).toBeDefined();
          expect(typeof colorSet[shade as keyof typeof colorSet]).toBe('string');
          expect(colorSet[shade as keyof typeof colorSet]).toMatch(/^#[0-9A-F]{6}$/i);
        });
      });
    });
  });

  describe('Lane vs Event Color Contrast', () => {
    it('should ensure sufficient contrast between lane backgrounds and event colors', () => {
      const laneColors = ['#E3F2FD', '#F3E5F5', '#E8F5E8', '#FFF8E1', '#FCE4EC'];
      const eventColors = ['#1565C0', '#7B1FA2', '#2E7D32', '#5D4037', '#C2185B'];

      laneColors.forEach((laneColor, index) => {
        const eventColor = eventColors[index];
        const contrastRatio = calculateContrastRatio(laneColor, eventColor);

        // レーン背景とイベント色のコントラスト比を確認
        expect(contrastRatio).toBeGreaterThanOrEqual(4.5);
        console.log(`Lane ${laneColor} vs Event ${eventColor}: ${contrastRatio.toFixed(2)}:1`);
      });
    });

    it('should ensure white text is readable on event colors', () => {
      const eventColors = ['#1565C0', '#7B1FA2', '#2E7D32', '#5D4037', '#C2185B'];
      const whiteText = '#FFFFFF';

      eventColors.forEach(eventColor => {
        const contrastRatio = calculateContrastRatio(eventColor, whiteText);

        // イベント色と白テキストのコントラスト比を確認
        expect(contrastRatio).toBeGreaterThanOrEqual(4.5);
        console.log(`Event ${eventColor} vs White text: ${contrastRatio.toFixed(2)}:1`);
      });
    });
  });

  describe('WCAG Compliance Summary', () => {
    it('should generate accessibility compliance report', () => {
      console.log('\n=== WCAG カラーアクセシビリティ レポート ===');

      accessibleColorPalettes.forEach((palette, index) => {
        const validation = validatePaletteAccessibility(palette);
        const laneEventContrast = calculateContrastRatio(palette.lane, palette.event);

        console.log(`\n${index + 1}. ${palette.name} パレット:`);
        console.log(`   レーン背景: ${palette.lane}`);
        console.log(`   イベント色: ${palette.event}`);
        console.log(`   テキスト色: ${palette.eventText}`);
        console.log(`   イベント/テキスト コントラスト: ${validation.contrastRatio}:1 (${validation.wcagLevel})`);
        console.log(`   レーン/イベント コントラスト: ${laneEventContrast.toFixed(2)}:1`);
      });

      console.log('\n=== 改善前後の比較 ===');
      console.log('改善前: レーン背景色とイベント色が同じため、可読性が低い');
      console.log('改善後: 各色でWCAG AA基準（4.5:1以上）を満たし、視認性が大幅に向上');
    });
  });
});
