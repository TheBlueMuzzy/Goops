import React from 'react';

interface HudMeterProps {
  value: number;        // Current fill level (0-100)
  maxValue?: number;    // Max value (default 100)
  colorMode: 'drain' | 'heat';
  x: number;            // X position in SVG coordinates
  y: number;            // Y position in SVG coordinates
  height?: number;      // Total height of the meter
  width?: number;       // Width of the meter
}

// Color interpolation helper
const interpolateColor = (value: number, colorMode: 'drain' | 'heat'): string => {
  // Normalize value to 0-1
  const t = Math.max(0, Math.min(100, value)) / 100;

  if (colorMode === 'drain') {
    // Drain mode: blue (high/100) → yellow (mid/50) → red (low/0)
    // So at high value (100), it's blue. At low (0), it's red.
    if (t > 0.5) {
      // Blue to yellow (t: 1 → 0.5)
      const localT = (t - 0.5) * 2; // 1 at t=1, 0 at t=0.5
      // Blue: #3b82f6, Yellow: #eab308
      const r = Math.round(234 + (59 - 234) * localT);
      const g = Math.round(179 + (130 - 179) * localT);
      const b = Math.round(8 + (246 - 8) * localT);
      return `rgb(${r}, ${g}, ${b})`;
    } else {
      // Yellow to red (t: 0.5 → 0)
      const localT = t * 2; // 1 at t=0.5, 0 at t=0
      // Yellow: #eab308, Red: #dc2626
      const r = Math.round(220 + (234 - 220) * localT);
      const g = Math.round(38 + (179 - 38) * localT);
      const b = Math.round(38 + (8 - 38) * localT);
      return `rgb(${r}, ${g}, ${b})`;
    }
  } else {
    // Heat mode: green (low/0) → yellow (mid/50) → red (high/100)
    // So at low value (0), it's green. At high (100), it's red.
    if (t < 0.5) {
      // Green to yellow (t: 0 → 0.5)
      const localT = t * 2; // 0 at t=0, 1 at t=0.5
      // Green: #22c55e, Yellow: #eab308
      const r = Math.round(34 + (234 - 34) * localT);
      const g = Math.round(197 + (179 - 197) * localT);
      const b = Math.round(94 + (8 - 94) * localT);
      return `rgb(${r}, ${g}, ${b})`;
    } else {
      // Yellow to red (t: 0.5 → 1)
      const localT = (t - 0.5) * 2; // 0 at t=0.5, 1 at t=1
      // Yellow: #eab308, Red: #dc2626
      const r = Math.round(234 + (220 - 234) * localT);
      const g = Math.round(179 + (38 - 179) * localT);
      const b = Math.round(8 + (38 - 8) * localT);
      return `rgb(${r}, ${g}, ${b})`;
    }
  }
};

export const HudMeter: React.FC<HudMeterProps> = ({
  value,
  maxValue = 100,
  colorMode,
  x,
  y,
  height = 200,
  width = 16
}) => {
  // Normalize value
  const normalizedValue = Math.max(0, Math.min(maxValue, value)) / maxValue;

  // Calculate fill height (fills from bottom up)
  const fillHeight = normalizedValue * (height - 4); // -4 for border padding

  // Get color based on value and mode
  const fillColor = interpolateColor(value, colorMode);

  // Border styling
  const borderColor = '#1f2937'; // dark gray
  const bgColor = '#111827';     // darker gray for empty part

  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Background/Border */}
      <rect
        x={0}
        y={0}
        width={width}
        height={height}
        rx={3}
        ry={3}
        fill={bgColor}
        stroke={borderColor}
        strokeWidth={1}
      />

      {/* Fill (from bottom) */}
      <rect
        x={2}
        y={height - 2 - fillHeight}
        width={width - 4}
        height={fillHeight}
        rx={2}
        ry={2}
        fill={fillColor}
      />

      {/* Tick marks for visual reference */}
      {[0.25, 0.5, 0.75].map((tick) => (
        <line
          key={tick}
          x1={0}
          y1={height - (tick * (height - 4)) - 2}
          x2={4}
          y2={height - (tick * (height - 4)) - 2}
          stroke={borderColor}
          strokeWidth={1}
          opacity={0.5}
        />
      ))}
    </g>
  );
};
