/**
 * EventBus.ts
 *
 * Global event management system. Stores events in Memory.events and
 * provides CRUD operations for publishing, querying, claiming, completing,
 * releasing, and expiring events.
 *
 * loadEventBus() / saveEventBus() are called from main.ts for tick boundaries.
 */

declare global {
  interface Memory {
    events: Record<string, Event[]>;
  }
}

import { buildDedupKey, generateEventId } from './Event';
import { canWorkerTakeEvent } from './tagSystem';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EventPublishData {
  type: string;
  room: string;
  targetId: string;
  requiredTags: string[];
  requiredCapacities?: Record<string, number>;
  priority?: number;
  minWorkers?: number;
  maxWorkers?: number;
  data?: Record<string, any>;
  allowFallback?: boolean;
  ttl?: number;
}

// ---------------------------------------------------------------------------
// EventBus
// ---------------------------------------------------------------------------

export const EventBus = {
  _events: {} as Record<string, Event[]>,
  _dedupIndex: {} as Record<string, Event>,

  /**
   * Publish a new event or merge with an existing pending event.
   */
  publish(eventData: EventPublishData): Event {
    const { type, room, targetId } = eventData;
    const dedupKey = buildDedupKey(type, room, targetId);

    // --- Check for existing event with same dedupKey ---

    const existing = this._dedupIndex[dedupKey];
    if (existing) {
      if (existing.status === 'pending') {
        existing.priority = Math.max(existing.priority, eventData.priority ?? 50);
        existing.ttl = eventData.ttl ?? 10;
        if (eventData.requiredTags?.length) {
          existing.requiredTags = eventData.requiredTags;
        }
        if (eventData.requiredCapacities) {
          existing.requiredCapacities = eventData.requiredCapacities;
        }
        if (eventData.minWorkers !== undefined) {
          existing.minWorkers = Math.max(existing.minWorkers, eventData.minWorkers);
        }
        if (eventData.maxWorkers !== undefined) {
          existing.maxWorkers = Math.max(existing.maxWorkers, eventData.maxWorkers);
        }
        if (eventData.data) {
          Object.assign(existing.data, eventData.data);
        }
        existing.createdAt = Game.time;
        return existing;
      }

      // Claimed but still has capacity -> still valid
      if (existing.status === 'claimed' && existing.currentWorkers < existing.maxWorkers) {
        return existing;
      }
    }

    // --- Create new event ---

    const id = generateEventId(type, room, targetId);
    const event: Event = {
      id,
      type,
      room,
      requiredTags: eventData.requiredTags,
      requiredCapacities: eventData.requiredCapacities ?? {},
      priority: eventData.priority ?? 50,
      status: 'pending',
      claimerId: null,
      claimedAt: null,
      minWorkers: eventData.minWorkers ?? 1,
      maxWorkers: eventData.maxWorkers ?? 1,
      currentWorkers: 0,
      data: eventData.data ?? {},
      allowFallback: eventData.allowFallback ?? false,
      createdAt: Game.time,
      ttl: eventData.ttl ?? 10,
      dedupKey,
    } as unknown as Event;

    // Store
    if (!this._events[room]) {
      this._events[room] = [];
    }
    this._events[room].push(event);
    this._dedupIndex[dedupKey] = event;

    return event;
  },

  /**
   * Query available events in a room that a worker can take.
   */
  query(
    workerTags: string[],
    capacities: Record<string, number>,
    roomName: string,
  ): Event[] {
    const events = this._events[roomName];
    if (!events) return [];

    const worker = { tags: workerTags, capacities };

    const scored: { event: Event; perfectMatch: boolean }[] = [];

    for (const event of events) {
      if (event.status !== 'pending') continue;
      if (event.currentWorkers >= event.maxWorkers) continue;
      if (Game.time - event.createdAt >= event.ttl) continue;

      const result = canWorkerTakeEvent(worker, event);
      if (result.match) {
        scored.push({ event, perfectMatch: result.perfectMatch });
      }
    }

    scored.sort((a, b) => {
      if (a.perfectMatch !== b.perfectMatch) {
        return a.perfectMatch ? -1 : 1;
      }
      if (a.event.priority !== b.event.priority) {
        return b.event.priority - a.event.priority;
      }
      return a.event.createdAt - b.event.createdAt;
    });

    return scored.map((s) => s.event);
  },

  /**
   * Claim an event for a worker.
   */
  claim(eventId: string, workerId: string): boolean {
    const event = this.findById(eventId);
    if (!event) return false;

    if (event.status !== 'pending') return false;
    if (Game.time - event.createdAt >= event.ttl) {
      event.status = 'expired';
      return false;
    }
    if (event.currentWorkers >= event.maxWorkers) return false;

    event.status = 'claimed';
    event.claimerId = workerId;
    event.claimedAt = Game.time;
    event.currentWorkers++;

    return true;
  },

  /**
   * Mark an event as completed.
   */
  complete(eventId: string): void {
    const event = this.findById(eventId);
    if (!event) return;
    event.status = 'completed';
  },

  /**
   * Release an event back to pending state.
   */
  release(eventId: string): void {
    const event = this.findById(eventId);
    if (!event) return;

    event.status = 'pending';
    event.currentWorkers = Math.max(0, event.currentWorkers - 1);
    if (event.currentWorkers === 0) {
      event.claimerId = null;
      event.claimedAt = null;
    }
  },

  /**
   * Force-expire an event.
   */
  expire(eventId: string): void {
    const event = this.findById(eventId);
    if (!event) return;
    event.status = 'expired';
    delete this._dedupIndex[event.dedupKey];
  },

  /**
   * Clean up stale events for a room (called at end of each tick).
   */
  cleanup(roomName: string): void {
    const events = this._events[roomName];
    if (!events) return;

    const alive: Event[] = [];

    for (const event of events) {
      if (event.status === 'expired' || Game.time - event.createdAt >= event.ttl) {
        delete this._dedupIndex[event.dedupKey];
        continue;
      }

      if (event.status === 'completed' && Game.time - event.createdAt > 3) {
        delete this._dedupIndex[event.dedupKey];
        continue;
      }

      if (event.status === 'claimed' && event.claimerId) {
        if (!Game.creeps[event.claimerId]) {
          event.currentWorkers = Math.max(0, event.currentWorkers - 1);
          if (event.currentWorkers === 0) {
            event.status = 'pending';
            event.claimerId = null;
            event.claimedAt = null;
          } else {
            event.claimerId = null;
            event.claimedAt = null;
          }
        }
      }

      alive.push(event);
    }

    if (alive.length > 0) {
      this._events[roomName] = alive;
    } else {
      delete this._events[roomName];
    }
  },

  /**
   * Find an event by its unique ID.
   */
  findById(eventId: string): Event | undefined {
    for (const roomEvents of Object.values(this._events)) {
      for (const event of roomEvents) {
        if (event.id === eventId) return event;
      }
    }
    return undefined;
  },
};

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------

/**
 * Restore EventBus state from Memory.events.
 */
export function loadEventBus(): void {
  const stored = Memory.events;
  if (!stored) {
    EventBus._events = {};
    EventBus._dedupIndex = {};
    return;
  }

  EventBus._events = stored;

  const idx: Record<string, Event> = {};
  for (const roomEvents of Object.values(stored)) {
    for (const event of roomEvents) {
      idx[event.dedupKey] = event;
    }
  }
  EventBus._dedupIndex = idx;
}

/**
 * Persist EventBus state to Memory.events.
 */
export function saveEventBus(): void {
  Memory.events = EventBus._events;
}