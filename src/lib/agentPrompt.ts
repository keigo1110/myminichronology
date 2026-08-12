/** 警告・エラーをコーディングエージェントへ投げる用のプロンプトを組み立てる */

export type AgentIssueKind = 'warning' | 'error';

export function buildAgentFixPrompt(options: {
  kind: AgentIssueKind;
  messages: string[];
  context?: string;
}): string {
  const unique = [...new Set(options.messages.map((m) => m.trim()).filter(Boolean))];
  const label = options.kind === 'error' ? 'エラー' : '警告';
  const lines = unique.map((m) => `- ${m}`).join('\n');

  return [
    'ミニクロ（myminichronology）の Excel 入力を直してください。',
    'Agent Skill「minikuro-excel-input」（年表用 Excel 入力作成）に従って対応してください。配置場所は環境により異なります。',
    '',
    `## 発生した${label}`,
    lines || '- （詳細なし）',
    '',
    '## 依頼',
    '- 上記を解消するよう入力ファイルまたはテンプレートを修正する',
    '- 列仕様の正本は `docs/excel-template-columns.md`',
    '- 利用者向け見本は `public/template_sample.xlsx`、検証用は `public/template_test.xlsx`',
    '- 修正後、同じ警告・エラーが出ないことを確認する',
    options.context ? `\n## 補足\n${options.context}` : '',
  ]
    .filter((line) => line !== '')
    .join('\n');
}

export async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fallback below
  }

  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}
