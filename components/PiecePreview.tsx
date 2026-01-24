import React from 'react';
import { PieceDefinition } from '../types';

interface PiecePreviewProps {
  piece: PieceDefinition | null;
  label: string;  // "HOLD" or "NEXT"
  visible: boolean;  // Show/hide based on upgrade ownership
}

// Fixed box size for consistent appearance (like old color pool boxes)
const BOX_SIZE = 48;  // Fixed internal size
const CELL_SIZE = 12; // Size of each block in preview

export const PiecePreview: React.FC<PiecePreviewProps> = ({ piece, label, visible }) => {
  if (!visible) return null;

  // Calculate piece bounds for centering (only if piece exists)
  let pieceContent = null;
  if (piece) {
    const minX = Math.min(...piece.cells.map(c => c.x));
    const maxX = Math.max(...piece.cells.map(c => c.x));
    const minY = Math.min(...piece.cells.map(c => c.y));
    const maxY = Math.max(...piece.cells.map(c => c.y));
    const pieceWidth = maxX - minX + 1;
    const pieceHeight = maxY - minY + 1;

    // Center the piece within the fixed box
    const offsetX = (BOX_SIZE - pieceWidth * CELL_SIZE) / 2;
    const offsetY = (BOX_SIZE - pieceHeight * CELL_SIZE) / 2;

    pieceContent = piece.cells.map((cell, i) => (
      <rect
        key={i}
        x={offsetX + (cell.x - minX) * CELL_SIZE}
        y={offsetY + (cell.y - minY) * CELL_SIZE}
        width={CELL_SIZE - 1}
        height={CELL_SIZE - 1}
        fill={piece.color}
        rx={2}
      />
    ));
  }

  return (
    <div style={{
      background: 'rgba(0, 0, 0, 0.8)',
      border: '2px solid #475569',
      borderRadius: '6px',
      padding: '4px 6px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      <div style={{
        fontSize: '9px',
        color: '#94a3b8',
        textAlign: 'center',
        marginBottom: '2px',
        fontFamily: 'monospace',
        letterSpacing: '1px'
      }}>
        {label}
      </div>
      <svg
        width={BOX_SIZE}
        height={BOX_SIZE}
        style={{ display: 'block' }}
      >
        {/* Empty box background */}
        <rect
          x={0}
          y={0}
          width={BOX_SIZE}
          height={BOX_SIZE}
          fill="rgba(30, 41, 59, 0.5)"
          rx={4}
        />
        {pieceContent}
      </svg>
    </div>
  );
};
