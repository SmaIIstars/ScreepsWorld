// src/structures/world.ts
// Scans neutral world objects and hostile creeps every 20 ticks.
// Snapshots amounts with decay rates; estimates current value each tick.

import { Guild } from '../core/Guild';
import { buildDedupKey } from '../core/Event';

export interface ResourceSnapshot {
  type: ResourceConstant;
  amount: number;
  decayPerTick: number; // Math.ceil(amount/1000) for drops, 0 for tombs/ruins (no decay)
  pos: { x: number; y: number; roomName: string };
  seenAt: number;
}

interface WorldCache {
  resources: Record<string, ResourceSnapshot>;
  tombs: Record<string, ResourceSnapshot>;
  ruins: Record<string, ResourceSnapshot>;
  hostileIds: string[];
  lastScan: number;
}

const SCAN_INTERVAL = 20;
const MIN_AMOUNT = 50;

function getWorldCache(room: Room): WorldCache {
  const roomMem = Memory.rooms[room.name];
  if (roomMem?._world) return roomMem._world;
  const fresh: WorldCache = {
    resources: {},
    tombs: {},
    ruins: {},
    hostileIds: [],
    lastScan: 0,
  };
  roomMem._world = fresh;
  return fresh;
}

export function refreshWorld(room: Room, cache: WorldCache): void {
  // Dropped resources — decay = ceil(amount / 1000) per tick
  const nextResources: Record<string, ResourceSnapshot> = {};
  for (const r of room.find(FIND_DROPPED_RESOURCES)) {
    nextResources[r.id] = {
      type: r.resourceType,
      amount: r.amount,
      decayPerTick: Math.ceil(r.amount / 1000),
      pos: { x: r.pos.x, y: r.pos.y, roomName: r.pos.roomName },
      seenAt: Game.time,
    };
  }
  cache.resources = nextResources;

  // Tombstones — linear decay
  const nextTombs: Record<string, ResourceSnapshot> = {};
  for (const t of room.find(FIND_TOMBSTONES)) {
    const store = t.store as Store<ResourceConstant, false>;
    const amount = store.getUsedCapacity(RESOURCE_ENERGY);
    if (amount > 0) {
      nextTombs[t.id] = {
        type: RESOURCE_ENERGY,
        amount,
        decayPerTick: 0, // resources don't decay inside tombstone
        pos: { x: t.pos.x, y: t.pos.y, roomName: t.pos.roomName },
        seenAt: Game.time,
      };
    }
  }
  cache.tombs = nextTombs;

  // Ruins — linear decay
  const nextRuins: Record<string, ResourceSnapshot> = {};
  for (const r of room.find(FIND_RUINS)) {
    const store = r.store as Store<ResourceConstant, false>;
    const amount = store.getUsedCapacity(RESOURCE_ENERGY);
    if (amount > 0) {
      nextRuins[r.id] = {
        type: RESOURCE_ENERGY,
        amount,
        decayPerTick: 0, // resources don't decay inside ruin
        pos: { x: r.pos.x, y: r.pos.y, roomName: r.pos.roomName },
        seenAt: Game.time,
      };
    }
  }
  cache.ruins = nextRuins;

  // Hostile creeps (record only, no attack events yet)
  cache.hostileIds = room.find(FIND_HOSTILE_CREEPS).map((c) => c.id);

  cache.lastScan = Game.time;
}

export function runCollectLifecycle(snap: ResourceSnapshot, id: string, room: Room): void {
  const dedupKey = buildDedupKey('collect', room.name, id);

  // Verify target still exists
  const target = Game.getObjectById(id as Id<any>);
  if (!target) return; // Gone — next scan removes from cache

  // Estimate remaining (universal linear formula)
  const remaining = snap.amount - (Game.time - snap.seenAt) * snap.decayPerTick;

  if (remaining < MIN_AMOUNT) {
    Guild.cancel(dedupKey);
    return;
  }

  const priority = 60 + Math.floor(Math.min(remaining, 5000) / 100);
  Guild.post({
    type: 'collect',
    room: room.name,
    targetId: id,
    requiredTags: ['transport', 'move'],
    requiredCapacities: { carry: 50 },
    priority,
    maxWorkers: 2,
    data: { targetId: id },
  });
}

export function getWorldCacheForRoom(room: Room): WorldCache {
  return getWorldCache(room);
}
