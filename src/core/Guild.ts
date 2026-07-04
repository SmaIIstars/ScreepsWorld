/**
 * Guild.ts
 *
 * Global demand management system. Stores events in Memory.events and
 * provides CRUD operations for posting, querying, claiming, completing,
 * releasing, cancelling, and expiring events.
 *
 * Events are keyed by room → dedupKey for O(1) lookup.
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
  quota?: EventQuota;
}
// ---------------------------------------------------------------------------
// Guild
// ---------------------------------------------------------------------------
export interface GuildType {
  _events: Record<string, Record<string, Event>>; // room → dedupKey → event
  post(eventData: DemandData): Event;
  query(workerTags: string[], capacities: Record<string, number>, roomName: string): Event[];
  claim(eventId: string, workerId: string, reserveAmount?: number): boolean;
  complete(eventId: string): void;
  release(eventId: string, workerId?: string): void;
  expire(eventId: string): void;
  cancel(dedupKey: string): void;
  completeByDedupKey(dedupKey: string): void;
  cleanup(roomName: string): void;
  findById(eventId: string): Event | undefined;
  getPendingByType(roomName: string, type: string): Event[];
  getRoomEvents(roomName: string): Record<string, Event>;
}

export const Guild: GuildType = {
  _events: {} as Record<string, Record<string, Event>>,

  /**
   * Post a new event or merge with an existing pending event.
   */
  post(eventData: DemandData): Event {
    const { type, room, targetId } = eventData;
    const dedupKey = buildDedupKey(type, room, targetId);

    // Auto-inject pos from target (unless caller already provided it)
    if (targetId && !eventData.data?.pos) {
      const target = Game.getObjectById(targetId as Id<any>);
      if (target && 'pos' in target) {
        if (!eventData.data) eventData.data = {};
        eventData.data = { ...eventData.data, ...target.pos };
      }
    }

    if (!this._events[room]) this._events[room] = {};
    const roomEvents = this._events[room];
    const existing = roomEvents[dedupKey];

    if (existing) {
      if (existing.status === 'expired' || existing.status === 'completed') {
        delete roomEvents[dedupKey];
      } else {
        existing.priority = Math.max(existing.priority, eventData.priority ?? 50);
        existing.createdAt = Game.time;
        if (eventData.requiredTags?.length) existing.requiredTags = eventData.requiredTags;
        if (eventData.requiredCapacities) existing.requiredCapacities = eventData.requiredCapacities;
        if (eventData.maxWorkers !== undefined) existing.maxWorkers = eventData.maxWorkers;
        if (eventData.minWorkers !== undefined) existing.minWorkers = eventData.minWorkers;
        if (eventData.data) Object.assign(existing.data, eventData.data);
        if (eventData.quota) {
          existing.data.quota = eventData.quota;
          const reserved = existing.data.reservations
            ? (Object.values(existing.data.reservations) as number[]).reduce((s: number, v: number) => s + v, 0)
            : 0;
          existing.data.remainingQuota = Math.max(0, eventData.quota.amount - reserved);
        }
        return existing;
      }
    }

    // Merge quota into data
    const eventData_data = { ...(eventData.data ?? {}) };
    if (eventData.quota) {
      eventData_data.quota = eventData.quota;
      eventData_data.remainingQuota = eventData.quota.amount;
      eventData_data.reservations = {};
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
      data: eventData_data,
      allowFallback: eventData.allowFallback ?? false,
      createdAt: Game.time,
      dedupKey,
    } as unknown as Event;

    roomEvents[dedupKey] = event;
    return event;
  },

  /**
   * Query available events in a room that a worker can take.
   */
  query(workerTags: string[], capacities: Record<string, number>, roomName: string): Event[] {
    const rm = this._events[roomName];
    if (!rm) return [];

    const worker = { tags: workerTags, capacities };
    const scored: { event: Event; perfectMatch: boolean }[] = [];

    for (const event of Object.values(rm)) {
      if (event.status !== 'pending' && event.status !== 'claimed') continue;
      if (event.currentWorkers >= event.maxWorkers) continue;
      // Quota exhausted — no more workers needed
      if (event.data.remainingQuota !== undefined && event.data.remainingQuota <= 0) continue;
      const result = canWorkerTakeEvent(worker, event);
      if (result.match) {
        scored.push({ event, perfectMatch: result.perfectMatch });
      }
    }
    scored.sort((a, b) => {
      if (a.perfectMatch !== b.perfectMatch) return a.perfectMatch ? -1 : 1;
      if (a.event.priority !== b.event.priority) return b.event.priority - a.event.priority;
      return a.event.createdAt - b.event.createdAt;
    });
    return scored.map((s) => s.event);
  },

  /**
   * Claim an event for a worker.
   */
  claim(eventId: string, workerId: string, reserveAmount?: number): boolean {
    const event = this.findById(eventId);
    if (!event) return false;
    if (event.status !== 'pending' && event.status !== 'claimed') return false;

    if (event.currentWorkers >= event.maxWorkers) return false;

    // Quota check: if remainingQuota is set and <= 0, no more claims
    if (event.data.remainingQuota !== undefined && event.data.remainingQuota <= 0) return false;

    // Reserve quota
    const amount = reserveAmount ?? 0;
    if (event.data.quota && amount > 0) {
      const toReserve = Math.min(amount, event.data.remainingQuota);
      if (!event.data.reservations) event.data.reservations = {};
      event.data.reservations[workerId] = toReserve;
      event.data.remainingQuota -= toReserve;
    }

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
    // Clear all reservations (quota consumed, not returned)
    if (event.data.reservations && event.data.quota) {
      const reserved = (Object.values(event.data.reservations) as number[]).reduce((s, v) => s + v, 0);
      event.data.remainingQuota = Math.max(0, event.data.quota.amount - reserved);
    }
    event.data.reservations = {};
    event.status = 'completed';
    event.completedAt = Game.time;
  },

  /** Complete an event by dedupKey — used by lifecycle scans to force-complete when target state changed. */
  completeByDedupKey(dedupKey: string): void {
    const room = dedupKey.split(':')[1];
    const rm = this._events[room];
    if (!rm) return;
    const event = rm[dedupKey];
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

    // Return reservation to remainingQuota
    if (workerId && event.data.reservations?.[workerId] !== undefined) {
      event.data.remainingQuota = (event.data.remainingQuota ?? 0) + event.data.reservations[workerId];
      delete event.data.reservations[workerId];
    }

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
    const rm = this._events[event.room];
    if (rm) delete rm[event.dedupKey];
  },

  /**
   * Cancel a demand by its dedupKey. No-op if not found or already claimed.
   */
  cancel(dedupKey: string): void {
    // dedupKey format: type:room:targetId
    const room = dedupKey.split(':')[1];
    const rm = this._events[room];
    if (!rm) return;
    const event = rm[dedupKey];
    if (!event) return;
    if (event.status === 'claimed') return; // someone is already working on it
    delete rm[dedupKey];
    if (Object.keys(rm).length === 0) delete this._events[room];
  },

  /**
   * Clean up stale events for a room (called at end of each tick).
   */
  cleanup(roomName: string): void {
    const rm = this._events[roomName];
    if (!rm) return;

    for (const dedupKey in rm) {
      const event = rm[dedupKey];

      if (event.status === 'expired') {
        delete rm[dedupKey];
        continue;
      }
      if (event.status === 'completed' && event.completedAt && Game.time - event.completedAt > 3) {
        delete rm[dedupKey];
        continue;
      }
      if (event.status === 'claimed' && event.claimerIds.length > 0) {
        const alive = event.claimerIds.filter((id: string) => Game.creeps[id]);

        // Return dead workers' reservations
        if (event.data.reservations) {
          for (const id of event.claimerIds) {
            if (!alive.includes(id) && event.data.reservations[id] !== undefined) {
              event.data.remainingQuota = (event.data.remainingQuota ?? 0) + event.data.reservations[id];
              delete event.data.reservations[id];
            }
          }
        }

        if (alive.length < event.claimerIds.length) {
          event.claimerIds = alive;
          event.currentWorkers = alive.length;
          if (event.currentWorkers === 0) {
            event.status = 'pending';
            event.claimerId = null;
            event.claimedAt = null;
          } else {
            event.claimerId = alive[alive.length - 1];
            event.claimedAt = null;
          }
        }
      }
    }

    if (Object.keys(rm).length === 0) delete this._events[roomName];
  },

  /**
   * Find an event by its unique ID.
   */
  findById(eventId: string): Event | undefined {
    for (const rm of Object.values(this._events)) {
      for (const event of Object.values(rm)) {
        if (event.id === eventId) return event;
      }
    }
    return undefined;
  },

  /**
   * Get all pending events of a given type in a room (no tag filtering).
   */
  getPendingByType(roomName: string, type: string): Event[] {
    const rm = this._events[roomName];
    if (!rm) return [];
    return Object.values(rm).filter((e) => e.type === type && e.status === 'pending');
  },

  /** Get all events in a room. Public read-only accessor. */
  getRoomEvents(roomName: string): Record<string, Event> {
    return this._events[roomName] || {};
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
    return;
  }
  Guild._events = stored;
  // Normalize: ensure every room is keyed by dedupKey
  for (const roomName in Guild._events) {
    const rm = Guild._events[roomName];
    // Migrate old array format if present
    if (Array.isArray(rm)) {
      const obj: Record<string, Event> = {};
      for (const event of rm) {
        obj[event.dedupKey] = event;
      }
      Guild._events[roomName] = obj;
    }
  }
}
/**
 * Persist Guild state to Memory.events.
 */
export function saveGuild(): void {
  Memory.events = Guild._events;
}
