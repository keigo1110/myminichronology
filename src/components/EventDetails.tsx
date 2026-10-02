'use client';

import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material';
import type { PositionedEvent } from '../lib/types';
import { useT } from '../i18n/LocaleProvider';

export function EventDetails({ event, onClose }: { event: PositionedEvent | null; onClose: () => void }) {
  const t = useT();
  return <Dialog open={Boolean(event)} onClose={onClose} fullWidth maxWidth="sm" aria-labelledby="event-detail-title">
    <DialogTitle id="event-detail-title">{t('event.details')}</DialogTitle>
    <DialogContent dividers>
      <Typography color="text.secondary" sx={{ mb: 2 }}>{event?.start}{event?.end != null ? ` – ${event.end}` : ''}</Typography>
      <Typography sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{event?.label}</Typography>
    </DialogContent>
    <DialogActions><Button onClick={onClose}>{t('alert.close')}</Button></DialogActions>
  </Dialog>;
}
