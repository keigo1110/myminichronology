'use client';

import React, { useState } from 'react';
import { Box, Chip } from '@mui/material';
import { useT } from '../i18n/LocaleProvider';

interface DraggableLaneListProps {
  lanes: string[];
  selectedLanes: string[];
  onLaneSelectionChange: (selectedLanes: string[]) => void;
  onLaneOrderChange: (orderedLanes: string[]) => void;
}

interface SortableLaneChipProps {
  lane: string;
  isSelected: boolean;
  onClick: () => void;
  onDragStart: (e: React.DragEvent, lane: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, lane: string) => void;
}

function SortableLaneChip({
  lane,
  isSelected,
  onClick,
  onDragStart,
  onDragOver,
  onDrop,
}: SortableLaneChipProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onClick();
  };

  return (
    <Chip
      label={lane}
      onClick={handleClick}
      draggable
      onDragStart={(e) => onDragStart(e, lane)}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver(e);
      }}
      onDrop={(e) => {
        e.preventDefault();
        onDrop(e, lane);
      }}
      variant={isSelected ? 'filled' : 'outlined'}
      color={isSelected ? 'primary' : 'default'}
      size="small"
      sx={{
        cursor: 'grab',
        fontSize: '0.75rem',
        height: 28,
        minHeight: 28,
        borderRadius: '2px',
        '& .MuiChip-label': {
          px: 1,
          py: 0.25,
        },
        ...(isSelected
          ? {}
          : {
              borderColor: 'divider',
              color: 'text.primary',
              backgroundColor: 'transparent',
            }),
        '&:hover': {
          backgroundColor: isSelected ? 'primary.dark' : 'action.hover',
        },
        '&:active': {
          cursor: 'grabbing',
        },
      }}
    />
  );
}

export function DraggableLaneList({
  lanes,
  selectedLanes,
  onLaneSelectionChange,
  onLaneOrderChange,
}: DraggableLaneListProps) {
  const t = useT();
  const [draggedLane, setDraggedLane] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, lane: string) => {
    setDraggedLane(lane);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetLane: string) => {
    e.preventDefault();

    if (draggedLane && draggedLane !== targetLane) {
      const oldIndex = lanes.indexOf(draggedLane);
      const newIndex = lanes.indexOf(targetLane);
      const newLanes = [...lanes];
      const [removed] = newLanes.splice(oldIndex, 1);
      newLanes.splice(newIndex, 0, removed);
      onLaneOrderChange(newLanes);
    }

    setDraggedLane(null);
  };

  const toggleLane = (lane: string) => {
    const newSelectedLanes = selectedLanes.includes(lane)
      ? selectedLanes.filter((l) => l !== lane)
      : [...selectedLanes, lane];
    onLaneSelectionChange(newSelectedLanes);
  };

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }} role="group" aria-label={t('header.laneSelectAria')}>
      {lanes.map((lane) => (
        <SortableLaneChip
          key={lane}
          lane={lane}
          isSelected={selectedLanes.includes(lane)}
          onClick={() => toggleLane(lane)}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        />
      ))}
    </Box>
  );
}
