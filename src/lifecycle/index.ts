/**
 * lifecycle/index.ts
 *
 * Lifecycle management module.
 *
 * Called from main.ts at specific points in the tick:
 *   1. Start of tick:  checkDeadCreeps()  – remove dead creeps, release their events
 *   2. After creeps:   cleanupEvents()   – sweep expired/completed events from EventBus
 *   3. End of tick:    persistEventBus() – persist EventBus state to Memory
 */

import { EventBus, saveEventBus } from '../core/EventBus';

/**
 * Scan Memory.creeps for entries whose creep no longer exists in Game.creeps.
 * For each dead creep:
 *   - Release any event it had claimed via EventBus.release()
 *   - Delete its creep memory entry
 *   - Also releases any claimed events
 */
export function checkDeadCreeps(): void {
  if (!Memory.creeps) return;

  for (const name in Memory.creeps) {
    if (!Game.creeps[name]) {
      const creepData = Memory.creeps[name];

      // Release any claimed event back to pending
      if (creepData?.currentEventId) {
        EventBus.release(creepData.currentEventId, name);
      }

      // Clean up Memory
      delete Memory.creeps[name];
    }
  }
}

/**
 * Iterate all rooms with events in the EventBus and run cleanup.
 * Removes expired events, prunes completed events older than 3 ticks,
 * and handles dead claimers.
 */
export function cleanupEvents(): void {
  if (!Memory.events) return;

  for (const roomName in Memory.events) {
    EventBus.cleanup(roomName);
  }
}

/**
 * Persist the EventBus in-memory state to Memory.events.
 * Called at the END of each tick so the state survives the tick boundary.
 */
export function persistEventBus(): void {
  saveEventBus();
}
