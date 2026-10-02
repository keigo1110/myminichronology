'use client';

import React, { useCallback, useState } from 'react';
import { Alert, IconButton, Tooltip, Box, Button, Collapse } from '@mui/material';
import { Close, ContentCopy, Check } from '@mui/icons-material';
import {
  AgentIssueKind,
  buildAgentFixPrompt,
  copyTextToClipboard,
} from '../lib/agentPrompt';
import { useT } from '../i18n/LocaleProvider';

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
  const t = useT();
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
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
            title={copied ? t('alert.copied') : t('alert.copyPrompt')}
          >
            <IconButton
              size="small"
              color="inherit"
              onClick={handleCopy}
              aria-label={t('alert.copyAria')}
            >
              {copied ? <Check fontSize="small" /> : <ContentCopy fontSize="small" />}
            </IconButton>
          </Tooltip>
          {onClose && (
            <IconButton
              size="small"
              color="inherit"
              onClick={onClose}
              aria-label={t('alert.close')}
            >
              <Close fontSize="small" />
            </IconButton>
          )}
        </Box>
      }
    >
      {children}
      {messages.length > 1 && <>
        <Button size="small" color="inherit" onClick={() => setExpanded(!expanded)} aria-expanded={expanded}>
          {t('alert.details', { count: messages.length })}
        </Button>
        <Collapse in={expanded}>
          <Box component="ul" sx={{ my: 1, pl: 2.5, maxHeight: 240, overflow: 'auto' }}>
            {messages.map((message, index) => <li key={index}>{message}</li>)}
          </Box>
        </Collapse>
      </>}
    </Alert>
  );
}
