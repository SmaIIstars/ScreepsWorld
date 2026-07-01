/**
 * runtime.ts
 *
 * Main Creep runtime loop. Every tick, each creep is driven through this
 * function to discover, claim, and execute work via the EventBus/behavior
 * event-driven task system.
 *
 * The loop has three phases:
 *   1. Ensure worker metadata exists in Memory.workers
 *   2. If the creep holds a currentEventId, execute that event (execute phase)
 *   3. If idle, query for matching events and claim one (find-work phase)
 */

declare global {
  interface Memory {
    workers: Record<string, WorkerMeta>;
  }

  interface CreepMemory {
    currentEventId?: string;
  }
}

import { EventBus } from '../core/EventBus';
import { computeTags, computeCapacities } from '../core/tagSystem';
import { getBehavior } from '../behavior/index';

const RESOURCE_ENERGY = 'energy' as const;

/**
 * Run one tick of the runtime loop for a single creep.
 *
 * @param creep - The Screeps Creep object driving this tick.
 */
export function runCreep(creep: Creep): void {
  // ---------------------------------------------------------------------------
  // Phase 1 – ensure worker metadata exists
  // ---------------------------------------------------------------------------
  if (!Memory.workers[creep.name]) {
    const tags = computeTags(creep.body);
    const capacities = computeCapacities(creep.body);
    Memory.workers[creep.name] = {
      id: creep.name,
      type: 'creep',
      room: creep.room.name,
      tags,
      capacities,
      currentEventId: null,
      rolePref: creep.memory.role || '',
      createdAt: Game.time,
      spawnBody: creep.body.map(part => ({ type: part.type, hits: part.hits })),
    };
  }
  // ---------------------------------------------------------------------------
  // Phase 2 – currently working on a claimed event → execute it
  // ---------------------------------------------------------------------------
  const currentEventId = creep.memory.currentEventId;
  if (currentEventId) {
    const event = EventBus.findById(currentEventId);
    // Event vanished, was released, or a different worker is now the claimer
    if (!event || event.status !== 'claimed' || event.claimerId !== creep.name) {
      delete creep.memory.currentEventId;
      return;
    }
    const behavior = getBehavior(event.type);
    // No behavior registered for this event type, or event is no longer valid
    if (!behavior || !behavior.validate(event)) {
      EventBus.release(event.id);
      delete creep.memory.currentEventId;
      return;
    }
    // Perform the work
    behavior.execute(creep, event);
    // Check whether the work is finished
    if (behavior.isComplete(creep, event)) {
      EventBus.complete(event.id);
      delete creep.memory.currentEventId;
    }
    return;
  }
  // ---------------------------------------------------------------------------
  // Phase 3 – idle → find and claim work
  // ---------------------------------------------------------------------------
  const tags = computeTags(creep.body);
  const capacities = computeCapacities(creep.body);
  const events = EventBus.query(tags, capacities, creep.room.name);
  if (events.length > 0) {
    const claimed = EventBus.claim(events[0].id, creep.name);
    if (claimed) {
      creep.memory.currentEventId = events[0].id;
    }
  }
}


