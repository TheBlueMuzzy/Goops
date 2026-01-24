import React from 'react';
import { PieceDefinition } from '../types';

interface PiecePreviewProps {
  piece: PieceDefinition | null;
  label: string;  // "HOLD" or "NEXT"
  visible: boolean;  // Show/hide based on upgrade ownership
}

export const PiecePreview: React.FC<PiecePreviewProps> = ({ piece, label, visible }) => {
  if (!visible || !piece) return null;

  // Calculate piece bounds for centering
  const minX = Math.min(...piece.cells.map(c => c.x));
  const maxX = Math.max(...piece.cells.map(c => c.x));
  const minY = Math.min(...piece.cells.map(c => c.y));
  const maxY = Math.max(...piece.cells.map(c => c.y));
  const width = maxX - minX + 1;
  const height = maxY - minY + 1;

  const cellSize = 16;
  const padding = 8;
  const boxWidth = Math.max(width, 2) * cellSize + padding * 2;
  const boxHeight = Math.max(height, 2) * cellSize + padding * 2 + 16; // +16 for label

  return (
    <div style={{
      background: 'rgba(0,0,0,0.7)',
      border: '2px solid #334155',
      borderRadius: '4px',
      padding: '4px',
      minWidth: boxWidth,
      minHeight: boxHeight
    }}>
      <div style={{
        fontSize: '10px',
        color: '#94a3b8',
        textAlign: 'center',
        marginBottom: '4px'
      }}>
        {label}
      </div>
      <svg
        width={Math.max(width, 2) * cellSize}
        height={Math.max(height, 2) * cellSize}
        style={{ display: 'block', margin: '0 auto' }}
      >
        {piece.cells.map((cell, i) => (
          <rect
            key={i}
            x={(cell.x - minX) * cellSize + (Math.max(width, 2) - width) * cellSize / 2}
            y={(cell.y - minY) * cellSize + (Math.max(height, 2) - height) * cellSize / 2}
            width={cellSize - 2}
            height={cellSize - 2}
            fill={piece.color}
            rx={2}
          />
        ))}
      </svg>
    </div>
  );
};
