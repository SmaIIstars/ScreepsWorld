import { SourceLifecycle } from './source';
import { ControllerLifecycle } from './controller';
import { SiteLifecycle } from './site';
import { SpawnLifecycle } from './spawn';
import { runWorkforceLifecycle } from './workforce';
import { runEnergyLifecycle } from './energy';

interface RoomCache {
  sourceIds: Id<Source>[];
  spawnIds: Id<StructureSpawn>[];
  energyIds: Id<AnyStoreStructure>[];
  controllerId: Id<StructureController> | null;
  siteIds: Id<ConstructionSite>[];
  lastScan: number;
  lastSiteScan: number;
}

const STATIC_INTERVAL = 20; // sources, controller, spawns, energy
const SITE_INTERVAL = 5;    // construction sites

function getCache(room: Room): RoomCache {
  if (!Memory.rooms) Memory.rooms = {};
  const cached = Memory.rooms[room.name] as RoomCache | undefined;
  if (cached && cached.sourceIds && cached.energyIds) return cached;

  // No cache or schema mismatch — full scan now
  const fresh: RoomCache = {
    sourceIds: [],
    spawnIds: [],
    energyIds: [],
    controllerId: null,
    siteIds: [],
    lastScan: 0,
    lastSiteScan: 0,
  };
  Memory.rooms[room.name] = fresh as any;
  refreshStatic(room, fresh);
  refreshSites(room, fresh);
  return fresh;
}

function refreshStatic(room: Room, cache: RoomCache): void {
  cache.sourceIds = room.find(FIND_SOURCES).map((s) => s.id);
  cache.spawnIds = room.find(FIND_MY_SPAWNS).map((s) => s.id);
  cache.energyIds = room
    .find(FIND_MY_STRUCTURES)
    .filter((s) =>
      s.structureType === STRUCTURE_SPAWN ||
      s.structureType === STRUCTURE_EXTENSION ||
      s.structureType === STRUCTURE_TOWER
    )
    .map((s) => s.id as Id<AnyStoreStructure>);
  cache.controllerId = room.controller?.id ?? null;
  cache.lastScan = Game.time;
}

function refreshSites(room: Room, cache: RoomCache): void {
  cache.siteIds = room.find(FIND_MY_CONSTRUCTION_SITES).map((s) => s.id);
  cache.lastSiteScan = Game.time;
}

export function runStructureLifecycles(room: Room): void {
  const cache = getCache(room);

  // ── Static (sources, controller, spawns, energy) — every STATIC_INTERVAL ticks ──
  if (Game.time - cache.lastScan >= STATIC_INTERVAL) {
    refreshStatic(room, cache);
  }

  // Sources
  for (const id of cache.sourceIds) {
    const obj = Game.getObjectById(id);
    if (obj) new SourceLifecycle(obj).runLifecycle();
  }

  // Controller
  if (cache.controllerId) {
    const ctrl = Game.getObjectById(cache.controllerId);
    if (ctrl) new ControllerLifecycle(ctrl).runLifecycle();
  }

  // Energy structures (fill demands)
  for (const id of cache.energyIds) {
    const obj = Game.getObjectById(id);
    if (obj) runEnergyLifecycle(obj);
  }

  // Spawns (creep production only)
  for (const id of cache.spawnIds) {
    const obj = Game.getObjectById(id);
    if (obj) new SpawnLifecycle(obj).runLifecycle();
  }

  // ── Sites — every SITE_INTERVAL ticks ──
  if (Game.time - cache.lastSiteScan >= SITE_INTERVAL) {
    refreshSites(room, cache);
  }

  for (const id of cache.siteIds) {
    const obj = Game.getObjectById(id);
    if (obj) new SiteLifecycle(obj).runLifecycle();
  }

  // ── Workforce — every tick (needs live creep count) ──
  runWorkforceLifecycle(room);
}
