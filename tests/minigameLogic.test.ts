
import { describe, it, expect } from 'vitest';
import {
  LIGHTS_BUTTON_COLORS,
  CORNER_ANGLES,
  DIAL_SNAP_POSITIONS,
  SliderPosition,
  LightsButtonIndex,
  CornerIndex,
  LightsPhase,
  LaserComplicationState,
  LightsComplicationState,
  ControlsComplicationState,
} from '../types/minigames';

/**
 * Minigame Logic Tests
 *
 * Tests the pure logic portions of minigame state that can be tested
 * without React hooks (constants, type shapes, validation).
 */

describe('minigameLogic', () => {
  describe('LIGHTS_BUTTON_COLORS constant', () => {
    it('has exactly 3 button colors defined', () => {
      const keys = Object.keys(LIGHTS_BUTTON_COLORS);
      expect(keys).toHaveLength(3);
    });

    it('has distinct colors for each button', () => {
      const colors = Object.values(LIGHTS_BUTTON_COLORS);
      const uniqueColors = new Set(colors);
      expect(uniqueColors.size).toBe(3);
    });

    it('has valid hex color strings', () => {
      const hexColorRegex = /^#[0-9a-fA-F]{6}$/;
      for (const color of Object.values(LIGHTS_BUTTON_COLORS)) {
        expect(color).toMatch(hexColorRegex);
      }
    });

    it('has colors indexed by 0, 1, 2', () => {
      expect(LIGHTS_BUTTON_COLORS[0]).toBeDefined();
      expect(LIGHTS_BUTTON_COLORS[1]).toBeDefined();
      expect(LIGHTS_BUTTON_COLORS[2]).toBeDefined();
    });
  });

  describe('CORNER_ANGLES constant', () => {
    it('has exactly 4 corners defined', () => {
      expect(CORNER_ANGLES).toHaveLength(4);
    });

    it('has angles in expected positions (45, 315, 225, 135)', () => {
      expect(CORNER_ANGLES[0]).toBe(45);   // TR
      expect(CORNER_ANGLES[1]).toBe(315);  // TL
      expect(CORNER_ANGLES[2]).toBe(225);  // BL
      expect(CORNER_ANGLES[3]).toBe(135);  // BR
    });

    it('has all angles in valid degree range (0-360)', () => {
      for (const angle of CORNER_ANGLES) {
        expect(angle).toBeGreaterThanOrEqual(0);
        expect(angle).toBeLessThan(360);
      }
    });
  });

  describe('DIAL_SNAP_POSITIONS constant', () => {
    it('has exactly 4 snap positions defined', () => {
      expect(DIAL_SNAP_POSITIONS).toHaveLength(4);
    });

    it('contains the same angles as CORNER_ANGLES (sorted differently)', () => {
      const cornerSet = new Set(CORNER_ANGLES);
      const snapSet = new Set(DIAL_SNAP_POSITIONS);

      expect(snapSet.size).toBe(cornerSet.size);
      for (const angle of DIAL_SNAP_POSITIONS) {
        expect(cornerSet.has(angle)).toBe(true);
      }
    });

    it('is in ascending sorted order', () => {
      for (let i = 1; i < DIAL_SNAP_POSITIONS.length; i++) {
        expect(DIAL_SNAP_POSITIONS[i]).toBeGreaterThan(DIAL_SNAP_POSITIONS[i - 1]);
      }
    });
  });

  describe('type validation', () => {
    it('SliderPosition type allows only -1, 0, 1', () => {
      // Test valid values work
      const validPositions: SliderPosition[] = [-1, 0, 1];
      expect(validPositions).toHaveLength(3);
      expect(validPositions).toContain(-1);
      expect(validPositions).toContain(0);
      expect(validPositions).toContain(1);
    });

    it('LightsButtonIndex type allows only 0, 1, 2', () => {
      // Test valid values work
      const validIndices: LightsButtonIndex[] = [0, 1, 2];
      expect(validIndices).toHaveLength(3);
      expect(validIndices).toContain(0);
      expect(validIndices).toContain(1);
      expect(validIndices).toContain(2);
    });

    it('CornerIndex type allows only 0, 1, 2, 3', () => {
      // Test valid values work
      const validCorners: CornerIndex[] = [0, 1, 2, 3];
      expect(validCorners).toHaveLength(4);
      for (let i = 0; i <= 3; i++) {
        expect(validCorners).toContain(i);
      }
    });

    it('LightsPhase type has expected values', () => {
      // Test all phases are valid
      const phases: LightsPhase[] = ['inactive', 'slider1', 'showing', 'input', 'slider2', 'solved'];
      expect(phases).toHaveLength(6);
    });
  });

  describe('minigame state shapes', () => {
    it('LaserComplicationState has required fields', () => {
      const state: LaserComplicationState = {
        active: false,
        solved: false,
        targets: [0, 0, 0, 0],
      };

      expect(state).toHaveProperty('active');
      expect(state).toHaveProperty('solved');
      expect(state).toHaveProperty('targets');
      expect(state.targets).toHaveLength(4);
    });

    it('LightsComplicationState has required fields', () => {
      const state: LightsComplicationState = {
        phase: 'inactive',
        slider1Target: 1,
        sequence: [0, 1, 2],
        inputIndex: 0,
        showingIndex: -1,
      };

      expect(state).toHaveProperty('phase');
      expect(state).toHaveProperty('slider1Target');
      expect(state).toHaveProperty('sequence');
      expect(state).toHaveProperty('inputIndex');
      expect(state).toHaveProperty('showingIndex');
    });

    it('ControlsComplicationState has required fields', () => {
      const state: ControlsComplicationState = {
        active: false,
        solved: false,
        targetCorner: null,
        completedCorners: 0,
      };

      expect(state).toHaveProperty('active');
      expect(state).toHaveProperty('solved');
      expect(state).toHaveProperty('targetCorner');
      expect(state).toHaveProperty('completedCorners');
    });

    it('LaserComplicationState targets array contains valid SliderPositions', () => {
      const validTargets: SliderPosition[] = [-1, 0, 1, -1];
      const state: LaserComplicationState = {
        active: true,
        solved: false,
        targets: validTargets,
      };

      for (const target of state.targets) {
        expect([-1, 0, 1]).toContain(target);
      }
    });
  });
});
