import React from 'react';

interface ActiveAbilityCircleProps {
  upgradeId: string;
  name: string;
  charge: number; // 0-100
  isReady: boolean; // charge >= 100
  x: number;
  y: number;
  size: number;
  onClick?: () => void;
}

// Icon mapping for active abilities (first letter as fallback)
const getAbilityIcon = (id: string): string => {
  switch (id) {
    case 'COOLDOWN_BOOSTER': return 'CB';
    case 'GOOP_DUMP': return 'GD';
    case 'GOOP_COLORIZER': return 'GC';
    case 'CRACK_DOWN': return 'CD';
    default: return id.charAt(0);
  }
};

// Color mapping for active abilities
const getAbilityColor = (id: string): string => {
  switch (id) {
    case 'COOLDOWN_BOOSTER': return '#5bbc70'; // Green
    case 'GOOP_DUMP': return '#f97316'; // Orange
    case 'GOOP_COLORIZER': return '#a855f7'; // Purple
    case 'CRACK_DOWN': return '#ef4444'; // Red
    default: return '#6acbda'; // Cyan default
  }
};

export const ActiveAbilityCircle: React.FC<ActiveAbilityCircleProps> = ({
  upgradeId,
  name,
  charge,
  isReady,
  x,
  y,
  size,
  onClick
}) => {
  const color = getAbilityColor(upgradeId);
  const icon = getAbilityIcon(upgradeId);
  const radius = size / 2;
  const strokeWidth = 3;
  const innerRadius = radius - strokeWidth;

  // Calculate fill arc (SVG circle circumference)
  const circumference = 2 * Math.PI * innerRadius;
  const fillLength = (charge / 100) * circumference;

  return (
    <g
      transform={`translate(${x}, ${y})`}
      style={{ cursor: isReady ? 'pointer' : 'default' }}
      onClick={isReady ? onClick : undefined}
    >
      {/* Background circle (grey) */}
      <circle
        cx={0}
        cy={0}
        r={innerRadius}
        fill="#1e293b"
        stroke="#475569"
        strokeWidth={strokeWidth}
      />

      {/* Fill progress arc */}
      <circle
        cx={0}
        cy={0}
        r={innerRadius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={circumference - fillLength}
        strokeLinecap="round"
        opacity={isReady ? 1 : 0.6}
        style={{
          transform: 'rotate(-90deg)',
          transformOrigin: 'center',
          transition: 'stroke-dashoffset 0.1s linear'
        }}
      />

      {/* Glow effect when ready */}
      {isReady && (
        <>
          <circle
            cx={0}
            cy={0}
            r={innerRadius + 2}
            fill="none"
            stroke={color}
            strokeWidth={2}
            opacity={0.5}
            className="animate-pulse"
          />
          <circle
            cx={0}
            cy={0}
            r={innerRadius}
            fill={color}
            fillOpacity={0.2}
          />
        </>
      )}

      {/* Icon text */}
      <text
        x={0}
        y={0}
        textAnchor="middle"
        dominantBaseline="central"
        fill={isReady ? 'white' : '#94a3b8'}
        fontSize={size * 0.3}
        fontWeight="bold"
        fontFamily="monospace"
      >
        {icon}
      </text>
    </g>
  );
};
