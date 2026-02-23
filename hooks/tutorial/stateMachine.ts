/**
 * Tutorial v3 — Step Lifecycle State Machine
 *
 * Each training step goes through a lifecycle:
 *   ENTERING → WAITING_FOR_TRIGGER → MESSAGE_VISIBLE → ARMED → ADVANCING
 *
 * Pause/unpause is a PROPERTY of the state, not a scattered action.
 * The state machine tracks the current lifecycle state and provides
 * explicit transition functions.
 */

import { useState, useCallback, useRef } from 'react';
import { StepLifecycleState, STEP_STATE_MAP, StepStateProperties } from '../../types/training';

export interface StepStateMachine {
  /** Current lifecycle state */
  state: StepLifecycleState;
  /** Properties derived from current state (isPaused, isFrozen, messageShown) */
  properties: StepStateProperties;
  /** Transition: step just started, cleaning up previous */
  enter: () => void;
  /** Transition: waiting for trigger condition (position, pressure, timer, etc.) */
  waitForTrigger: () => void;
  /** Transition: message is now visible (may be paused or running) */
  showMessage: () => void;
  /** Transition: player can now trigger advance (action armed) */
  armAdvance: () => void;
  /** Transition: advancing to next step */
  advance: () => void;
  /** Reset to ENTERING state (called on step change) */
  reset: () => void;
  /** Get whether advance is currently armed */
  isArmed: () => boolean;
}

/**
 * Hook that manages the step lifecycle state machine.
 *
 * Usage:
 *   const sm = useStepStateMachine();
 *   sm.enter();        // Step begins
 *   sm.showMessage();  // Message appears
 *   sm.armAdvance();   // Player can now act
 *   sm.advance();      // Moving to next step
 */
export function useStepStateMachine(): StepStateMachine {
  const [state, setState] = useState<StepLifecycleState>(StepLifecycleState.ENTERING);

  // Use ref for armed check so event handlers always see latest value
  const stateRef = useRef<StepLifecycleState>(state);

  const transitionTo = useCallback((newState: StepLifecycleState) => {
    setState(newState);
    stateRef.current = newState;
  }, []);

  const enter = useCallback(() => {
    transitionTo(StepLifecycleState.ENTERING);
  }, [transitionTo]);

  const waitForTrigger = useCallback(() => {
    transitionTo(StepLifecycleState.WAITING_FOR_TRIGGER);
  }, [transitionTo]);

  const showMessage = useCallback(() => {
    transitionTo(StepLifecycleState.MESSAGE_VISIBLE);
  }, [transitionTo]);

  const armAdvance = useCallback(() => {
    transitionTo(StepLifecycleState.ARMED);
  }, [transitionTo]);

  const advance = useCallback(() => {
    transitionTo(StepLifecycleState.ADVANCING);
  }, [transitionTo]);

  const reset = useCallback(() => {
    transitionTo(StepLifecycleState.ENTERING);
  }, [transitionTo]);

  const isArmed = useCallback(() => {
    return stateRef.current === StepLifecycleState.ARMED;
  }, []);

  const properties = STEP_STATE_MAP[state];

  return {
    state,
    properties,
    enter,
    waitForTrigger,
    showMessage,
    armAdvance,
    advance,
    reset,
    isArmed,
  };
}
