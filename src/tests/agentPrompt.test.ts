import { describe, it, expect } from 'vitest';
import { buildAgentFixPrompt } from '../lib/agentPrompt';

describe('buildAgentFixPrompt', () => {
  it('includes skill path and warning messages', () => {
    const prompt = buildAgentFixPrompt({
      kind: 'warning',
      messages: [
        'シート「5_境界値」9行目: 表示スタイル「box」は未対応のため通常表示にします（使える値: 空欄 または label）。',
      ],
    });

    expect(prompt).toContain('minikuro-excel-input');
    expect(prompt).not.toContain('.cursor/skills');
    expect(prompt).toContain('## 発生した警告');
    expect(prompt).toContain('表示スタイル「box」');
    expect(prompt).toContain('docs/excel-template-columns.md');
  });

  it('dedupes empty messages and labels errors', () => {
    const prompt = buildAgentFixPrompt({
      kind: 'error',
      messages: ['同じ', '同じ', '  '],
    });
    expect(prompt).toContain('## 発生したエラー');
    expect(prompt.match(/- 同じ/g)).toHaveLength(1);
  });
});
