import React, { useState } from 'react';
import { Box, Typography, Chip } from '@mui/material';

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
  onDrop
}: SortableLaneChipProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent default drag behavior if it's also a click
    e.stopPropagation(); // Stop event from bubbling up to parent drag handlers
    onClick();
  };

  const handleDragStart = (e: React.DragEvent) => {
    onDragStart(e, lane);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Necessary to allow dropping
    onDragOver(e);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    onDrop(e, lane);
  };

  return (
    <Chip
      label={lane}
      onClick={handleClick}
      draggable // Enable native drag and drop
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      color={isSelected ? 'primary' : 'default'}
      variant={isSelected ? 'filled' : 'outlined'}
      size="small"
      sx={{
        cursor: 'pointer', // Indicate it's clickable
        fontSize: '0.7rem',
        height: 20,
        '& .MuiChip-label': {
          px: 0.75,
          py: 0.25
        },
        '&:hover': {
          backgroundColor: isSelected ? 'primary.light' : 'action.hover',
        },
        '&:active': {
          cursor: 'grabbing', // Indicate it's draggable when active
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
  const [draggedLane, setDraggedLane] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, lane: string) => {
    setDraggedLane(lane);
    e.dataTransfer.effectAllowed = 'move'; // Specify the drag effect
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Necessary to allow dropping
    e.dataTransfer.dropEffect = 'move'; // Visual feedback for drop
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

    setDraggedLane(null); // Reset dragged lane state
  };

  const toggleLane = (lane: string) => {
    const newSelectedLanes = selectedLanes.includes(lane)
      ? selectedLanes.filter(l => l !== lane)
      : [...selectedLanes, lane];

    onLaneSelectionChange(newSelectedLanes);
  };

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.25 }}>
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