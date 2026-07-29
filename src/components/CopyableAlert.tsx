'use client';

import React, { useCallback, useState } from 'react';
import { Alert, IconButton, Tooltip, Box } from '@mui/material';
import { Close, ContentCopy, Check } from '@mui/icons-material';
import {
  AgentIssueKind,
  buildAgentFixPrompt,
  copyTextToClipboard,
} from '../lib/agentPrompt';

interface CopyableAlertProps {
  severity: 'error' | 'warning' | 'info' | 'success';
  /** 画面に出す本文（要約可） */
  children: React.ReactNode;
  /** エージェント用にコピーする生メッセージ一覧 */
  messages: string[];
  kind?: AgentIssueKind;
  context?: string;
  onClose?: () => void;
  sx?: object;
}

export function CopyableAlert({
  severity,
  children,
  messages,
  kind,
  context,
  onClose,
  sx,
}: CopyableAlertProps) {
  const [copied, setCopied] = useState(false);
  const issueKind: AgentIssueKind =
    kind ?? (severity === 'error' ? 'error' : 'warning');

  const handleCopy = useCallback(async () => {
    const prompt = buildAgentFixPrompt({
      kind: issueKind,
      messages,
      context,
    });
    const ok = await copyTextToClipboard(prompt);
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  }, [issueKind, messages, context]);

  return (
    <Alert
      severity={severity}
      sx={sx}
      action={
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
          <Tooltip
            title={
              copied
                ? 'コピーしました'
                : 'エージェント用プロンプトをコピー（Skill 付きチャットに貼り付け）'
            }
          >
            <IconButton
              size="small"
              color="inherit"
              onClick={handleCopy}
              aria-label="エージェント用プロンプトをコピー"
            >
              {copied ? <Check fontSize="small" /> : <ContentCopy fontSize="small" />}
            </IconButton>
          </Tooltip>
          {onClose && (
            <IconButton
              size="small"
              color="inherit"
              onClick={onClose}
              aria-label="閉じる"
            >
              <Close fontSize="small" />
            </IconButton>
          )}
        </Box>
      }
    >
      {children}
    </Alert>
  );
}
