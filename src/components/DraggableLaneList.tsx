'use client';

import React, { useState } from 'react';
import { Box, Chip, IconButton } from '@mui/material';
import { KeyboardArrowLeft, KeyboardArrowRight } from '@mui/icons-material';
import { useT } from '../i18n/LocaleProvider';

interface DraggableLaneListProps {
  lanes: string[];
  selectedLanes: string[];
  onLaneSelectionChange: (selectedLanes: string[]) => void;
  onLaneOrderChange: (orderedLanes: string[]) => void;
  disabled?: boolean;
}

export function DraggableLaneList({ lanes, selectedLanes, onLaneSelectionChange, onLaneOrderChange, disabled = false }: DraggableLaneListProps) {
  const t = useT();
  const [draggedLane, setDraggedLane] = useState<string | null>(null);
  const move = (lane: string, target: number) => {
    const source = lanes.indexOf(lane);
    if (disabled || source < 0 || target < 0 || target >= lanes.length || source === target) return;
    const next = [...lanes];
    next.splice(target, 0, ...next.splice(source, 1));
    onLaneOrderChange(next);
  };
  const isFile = (e: React.DragEvent) => Array.from(e.dataTransfer.types ?? []).includes('Files');
  return <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }} role="group" aria-label={t('header.laneSelectAria')}>
    {lanes.map((lane, index) => {
      const selected = selectedLanes.includes(lane);
      return <Box key={lane} sx={{ display: 'flex', alignItems: 'center' }}>
        <Chip label={lane} size="small" disabled={disabled} aria-pressed={selected}
          variant={selected ? 'filled' : 'outlined'} color={selected ? 'primary' : 'default'}
          draggable={!disabled}
          onClick={() => onLaneSelectionChange(selected ? selectedLanes.filter((name) => name !== lane) : [...selectedLanes, lane])}
          onDragStart={(e) => {
            e.stopPropagation();
            if (disabled) { e.preventDefault(); return; }
            setDraggedLane(lane);
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('application/x-timeline-lane', lane);
          }}
          onDragOver={(e) => {
            if (isFile(e) || !draggedLane || disabled) return;
            e.preventDefault(); e.stopPropagation(); e.dataTransfer.dropEffect = 'move';
          }}
          onDrop={(e) => {
            if (isFile(e) || !draggedLane || disabled) return;
            e.preventDefault(); e.stopPropagation(); move(draggedLane, index); setDraggedLane(null);
          }}
          onDragEnd={(e) => { e.stopPropagation(); setDraggedLane(null); }}
          sx={{ cursor: disabled ? 'default' : 'grab', fontSize: '0.75rem', height: 28, borderRadius: '2px' }}
        />
        <IconButton size="small" aria-label={t('header.moveLaneLeft', { lane })} disabled={disabled || index === 0}
          onClick={() => move(lane, index - 1)} sx={{ width: 28, height: 28 }}><KeyboardArrowLeft fontSize="small" /></IconButton>
        <IconButton size="small" aria-label={t('header.moveLaneRight', { lane })} disabled={disabled || index === lanes.length - 1}
          onClick={() => move(lane, index + 1)} sx={{ width: 28, height: 28 }}><KeyboardArrowRight fontSize="small" /></IconButton>
      </Box>;
    })}
  </Box>;
}
