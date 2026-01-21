import React from 'react';
import { UPGRADES } from '../constants';
import { X } from 'lucide-react';

interface UpgradePanelProps {
  powerUpPoints: number;
  upgrades: Record<string, number>;
  rank: number;
  onPurchase: (upgradeId: string) => void;
  onClose: () => void;
}

const SYSTEM_UPGRADES = ['LASER', 'LIGHTS', 'CONTROLS'] as const;

// Game color palette (matches EndGameScreen.tsx)
const COLORS = {
  panelBg: '#1f1f38',      // Dark blue background
  cardBg: '#0c0f19',       // Near black for cards
  headerBg: '#f2a743',     // Orange header
  headerText: '#1d1d3a',   // Dark text on orange
  labelText: '#6acbda',    // Cyan for labels
  valueText: '#ffffff',    // White for values
  mutedText: '#59acae',    // Muted cyan
  border: '#ffffff',       // White borders
  success: '#5bbc70',      // Green for success/points
};

// System-specific accent colors (darker variants matching game aesthetic)
const UPGRADE_ACCENTS: Record<string, { accent: string; text: string }> = {
  LASER: { accent: '#d82727', text: '#ff6b6b' },
  LIGHTS: { accent: '#d36b28', text: '#ffa94d' },
  CONTROLS: { accent: '#2d5a87', text: '#74c0fc' },
};

export const UpgradePanel: React.FC<UpgradePanelProps> = ({
  powerUpPoints,
  upgrades,
  rank,
  onPurchase,
  onClose
}) => {
  // Filter upgrades by player rank (UAT-001)
  const availableUpgrades = SYSTEM_UPGRADES.filter(
    id => UPGRADES[id].unlockRank <= rank
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div
        className="relative w-[90%] max-w-md rounded-2xl shadow-2xl overflow-hidden"
        style={{ backgroundColor: COLORS.panelBg }}
      >
        {/* Header - Orange bar like monitor body */}
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ backgroundColor: COLORS.headerBg }}
        >
          <h2
            className="text-xl font-bold tracking-wider"
            style={{ color: COLORS.headerText, fontFamily: "'From Where You Are', sans-serif" }}
          >
            SYSTEM UPGRADES
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:opacity-80 transition-opacity"
          >
            <X className="w-6 h-6" style={{ color: COLORS.headerText }} />
          </button>
        </div>

        {/* Points Display */}
        <div
          className="px-4 py-3 border-b"
          style={{ borderColor: COLORS.labelText + '40' }}
        >
          <div className="flex items-center justify-between">
            <span
              className="text-sm tracking-wide"
              style={{ color: COLORS.labelText, fontFamily: "'Amazon Ember', sans-serif" }}
            >
              AVAILABLE POWER
            </span>
            <span
              className="text-2xl font-bold"
              style={{ color: COLORS.success, fontFamily: "'Amazon Ember', sans-serif" }}
            >
              {powerUpPoints}
            </span>
          </div>
        </div>

        {/* Upgrades List */}
        <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
          {availableUpgrades.length === 0 ? (
            // Empty state (UAT-002)
            <div className="text-center py-8">
              <p
                className="text-lg tracking-wide"
                style={{ color: COLORS.labelText, fontFamily: "'From Where You Are', sans-serif" }}
              >
                NO UPGRADES AVAILABLE
              </p>
              <p
                className="text-sm mt-2"
                style={{ color: COLORS.mutedText }}
              >
                Reach Rank 1 to unlock your first upgrade
              </p>
            </div>
          ) : (
            availableUpgrades.map(upgradeId => {
              const config = UPGRADES[upgradeId];
              const currentLevel = upgrades[upgradeId] || 0;
              const isMaxLevel = currentLevel >= config.maxLevel;
              const canAfford = powerUpPoints >= config.costPerLevel;
              const canPurchase = canAfford && !isMaxLevel;
              const accent = UPGRADE_ACCENTS[upgradeId];

              return (
                <div
                  key={upgradeId}
                  className="rounded-xl p-4 border"
                  style={{
                    backgroundColor: COLORS.cardBg,
                    borderColor: COLORS.border
                  }}
                >
                  {/* Upgrade Header */}
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3
                        className="font-bold text-lg tracking-wide"
                        style={{ color: accent.text, fontFamily: "'Amazon Ember', sans-serif" }}
                      >
                        {config.name}
                      </h3>
                      <p
                        className="text-sm mt-1"
                        style={{ color: COLORS.mutedText }}
                      >
                        {config.desc}
                      </p>
                    </div>
                  </div>

                  {/* Level Indicator */}
                  <div className="flex items-center gap-2 my-3">
                    <span
                      className="text-xs"
                      style={{ color: COLORS.labelText }}
                    >
                      LVL
                    </span>
                    <div className="flex gap-1">
                      {Array.from({ length: config.maxLevel }).map((_, i) => (
                        <div
                          key={i}
                          className="w-6 h-3 rounded-sm border"
                          style={{
                            borderColor: i < currentLevel ? accent.accent : COLORS.mutedText + '60',
                            backgroundColor: i < currentLevel ? accent.accent : 'transparent'
                          }}
                        />
                      ))}
                    </div>
                    <span
                      className="text-sm font-bold"
                      style={{ color: accent.text }}
                    >
                      {currentLevel}/{config.maxLevel}
                    </span>
                  </div>

                  {/* Current Effect */}
                  {currentLevel > 0 && (
                    <div
                      className="text-sm mb-2"
                      style={{ color: COLORS.valueText }}
                    >
                      Current: {config.formatEffect(currentLevel)}
                    </div>
                  )}

                  {/* Max Level Bonus */}
                  {isMaxLevel && config.maxLevelBonus && (
                    <div
                      className="text-sm mb-2 italic"
                      style={{ color: COLORS.success }}
                    >
                      MAX: {config.maxLevelBonus}
                    </div>
                  )}

                  {/* Purchase Button */}
                  <button
                    onClick={() => onPurchase(upgradeId)}
                    disabled={!canPurchase}
                    className="w-full mt-2 py-2 px-4 rounded-lg font-bold text-sm transition-all border-2"
                    style={{
                      borderColor: canPurchase ? accent.accent : COLORS.mutedText + '40',
                      color: canPurchase ? accent.text : COLORS.mutedText + '60',
                      backgroundColor: canPurchase ? accent.accent + '20' : 'transparent',
                      cursor: canPurchase ? 'pointer' : 'not-allowed',
                      fontFamily: "'Amazon Ember', sans-serif"
                    }}
                  >
                    {isMaxLevel ? 'MAX LEVEL' : `UPGRADE (${config.costPerLevel} PWR)`}
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Tip */}
        <div
          className="px-4 py-3 border-t text-center"
          style={{ borderColor: COLORS.labelText + '40' }}
        >
          <p
            className="text-xs"
            style={{ color: COLORS.mutedText }}
          >
            Earn 1 PWR per rank gained
          </p>
        </div>
      </div>
    </div>
  );
};
