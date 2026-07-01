/**
 * Guild.ts
 *
 * Global demand management system. Stores events in Memory.events and
 * provides CRUD operations for posting, querying, claiming, completing,
 * releasing, cancelling, and expiring events.
 *
 * loadGuild() / saveGuild() are called from main.ts for tick boundaries.
 */
import { buildDedupKey, generateEventId } from './Event';
import { canWorkerTakeEvent } from './tagSystem';
// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface DemandData {
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
}
// ---------------------------------------------------------------------------
// Guild
// ---------------------------------------------------------------------------
export interface GuildType {
  _events: Record<string, Event[]>;
  _dedupIndex: Record<string, Event>;
  post(eventData: DemandData): Event;
  query(workerTags: string[], capacities: Record<string, number>, roomName: string): Event[];
  claim(eventId: string, workerId: string): boolean;
  complete(eventId: string): void;
  release(eventId: string, workerId?: string): void;
  expire(eventId: string): void;
  cancel(dedupKey: string): void;
  cleanup(roomName: string): void;
  findById(eventId: string): Event | undefined;
  getPendingByType(roomName: string, type: string): Event[];
}

export const Guild: GuildType = {
  _events: {} as Record<string, Event[]>,
  _dedupIndex: {} as Record<string, Event>,
  /**
   * Post a new event or merge with an existing pending event.
   */
  post(eventData: DemandData): Event {
    const { type, room, targetId } = eventData;
    const dedupKey = buildDedupKey(type, room, targetId);
    // --- Check for existing event with same dedupKey ---
    const existing = this._dedupIndex[dedupKey];
    if (existing) {
      if (existing.status === 'expired') {
        delete this._dedupIndex[existing.dedupKey];
      } else {
        // Reuse existing event - merge priority and refresh timestamp
        existing.priority = Math.max(existing.priority, eventData.priority ?? 50);
        existing.createdAt = Game.time;
        if (eventData.requiredTags?.length) existing.requiredTags = eventData.requiredTags;
        if (eventData.requiredCapacities) existing.requiredCapacities = eventData.requiredCapacities;
        if (eventData.data) Object.assign(existing.data, eventData.data);
        return existing;
      }
    }

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
      claimerIds: [],
      minWorkers: eventData.minWorkers ?? 1,
      maxWorkers: eventData.maxWorkers ?? 1,
      currentWorkers: 0,
      data: eventData.data ?? {},
      allowFallback: eventData.allowFallback ?? false,
      createdAt: Game.time,
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
  query(workerTags: string[], capacities: Record<string, number>, roomName: string): Event[] {
    const events = this._events[roomName];
    if (!events) return [];
    const worker = { tags: workerTags, capacities };
    const scored: { event: Event; perfectMatch: boolean }[] = [];
    for (const event of events) {
      if (event.status !== 'pending') continue;
      if (event.currentWorkers >= event.maxWorkers) continue;
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
    if (event.status !== 'pending' && event.status !== 'claimed') return false;

    if (event.currentWorkers >= event.maxWorkers) return false;
    event.currentWorkers++;
    if (!event.claimerIds.includes(workerId)) event.claimerIds.push(workerId);
    event.claimerId = workerId;
    event.claimedAt = Game.time;
    event.status = 'claimed';
    return true;
  },
  /**
   * Mark an event as completed.
   */
  complete(eventId: string): void {
    const event = this.findById(eventId);
    if (!event) return;
    event.status = 'completed';
    event.completedAt = Game.time;
  },
  /**
   * Release an event back to pending state.
   */
  release(eventId: string, workerId?: string): void {
    const event = this.findById(eventId);
    if (!event) return;
    if (workerId) {
      event.claimerIds = event.claimerIds.filter((id: string) => id !== workerId);
    } else {
      event.claimerIds.pop();
    }
    event.currentWorkers = event.claimerIds.length;
    if (event.currentWorkers === 0) {
      event.status = 'pending';
      event.claimerId = null;
      event.claimedAt = null;
    } else {
      event.claimerId = event.claimerIds[0];
      event.claimedAt = Game.time;
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
   * Cancel a demand by its dedupKey. No-op if not found or already claimed.
   */
  cancel(dedupKey: string): void {
    const event = this._dedupIndex[dedupKey];
    if (!event) return;
    if (event.status === 'claimed') return; // Let it finish naturally
    delete this._dedupIndex[dedupKey];
    const roomEvents = this._events[event.room];
    if (roomEvents) {
      this._events[event.room] = roomEvents.filter((e) => e.id !== event.id);
      if (this._events[event.room].length === 0) {
        delete this._events[event.room];
      }
    }
  },
  /**
   * Clean up stale events for a room (called at end of each tick).
   */
  cleanup(roomName: string): void {
    const events = this._events[roomName];
    if (!events) return;
    const alive: Event[] = [];
    for (const event of events) {
      if (event.status === 'expired') {
        event.status = 'expired';
        delete this._dedupIndex[event.dedupKey];
        continue;
      }
      if (event.status === 'completed' && event.completedAt && Game.time - event.completedAt > 3) {
        delete this._dedupIndex[event.dedupKey];
        continue;
      }
      if (event.status === 'claimed' && event.claimerIds.length > 0) {
        const aliveClaimers = event.claimerIds.filter((id: string) => Game.creeps[id]);
        const deadCount = event.claimerIds.length - aliveClaimers.length;
        if (deadCount > 0) {
          event.claimerIds = aliveClaimers;
          event.currentWorkers = aliveClaimers.length;
          if (event.currentWorkers === 0) {
            event.status = 'pending';
            event.claimerId = null;
            event.claimedAt = null;
          } else {
            event.claimerId = event.claimerIds[event.claimerIds.length - 1];
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
  /**
   * Get all pending events of a given type in a room (no tag filtering).
   */
  getPendingByType(roomName: string, type: string): Event[] {
    const events = this._events[roomName];
    if (!events) return [];
    return events.filter((e) => e.type === type && e.status === 'pending');
  },
};
// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------
/**
 * Restore Guild state from Memory.events.
 */
export function loadGuild(): void {
  const stored = Memory.events;
  if (!stored) {
    Guild._events = {};
    Guild._dedupIndex = {};
    return;
  }
  Guild._events = stored;
  const idx: Record<string, Event> = {};
  for (const roomEvents of Object.values(stored)) {
    for (const event of roomEvents) {
      idx[event.dedupKey] = event;
    }
  }
  Guild._dedupIndex = idx;
}
/**
 * Persist Guild state to Memory.events.
 */
export function saveGuild(): void {
  Memory.events = Guild._events;
}
