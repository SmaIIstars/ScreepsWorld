import { SourceLifecycle } from './source';
import { ControllerLifecycle } from './controller';
import { SiteLifecycle } from './site';
import { SpawnLifecycle } from './spawn';
import { runWorkforceLifecycle } from './workforce';
import { runEnergyLifecycle } from './energy';

interface RoomCache {
  sourceIds: Id<Source>[];
  spawnIds: Id<StructureSpawn>[];
  fillTargetIds: Id<AnyStoreStructure>[];
  controllerId: Id<StructureController> | null;
  siteIds: Id<ConstructionSite>[];
  lastScan: number;
  lastSiteScan: number;
}

const STRUCTURE_INTERVAL = 20; // owned structures + sources + controller
const SITE_INTERVAL = 5;       // construction sites

function getCache(room: Room): RoomCache {
  if (!Memory.rooms) Memory.rooms = {};
  const cached = Memory.rooms[room.name] as RoomCache | undefined;
  if (cached && cached.sourceIds && cached.fillTargetIds) return cached;

  const fresh: RoomCache = {
    sourceIds: [],
    spawnIds: [],
    fillTargetIds: [],
    controllerId: null,
    siteIds: [],
    lastScan: 0,
    lastSiteScan: 0,
  };
  Memory.rooms[room.name] = fresh as any;
  refreshStructures(room, fresh);
  refreshSites(room, fresh);
  return fresh;
}

function refreshStructures(room: Room, cache: RoomCache): void {
  const sources: Id<Source>[] = [];
  const spawns: Id<StructureSpawn>[] = [];
  const fills: Id<AnyStoreStructure>[] = [];

  // Sources (not owned structures, separate API)
  for (const s of room.find(FIND_SOURCES)) sources.push(s.id);

  // One pass over all owned structures — dispatch by type
  for (const s of room.find(FIND_MY_STRUCTURES)) {
    switch (s.structureType) {
      case STRUCTURE_SPAWN: {
        const sp = s as StructureSpawn;
        spawns.push(sp.id);
        fills.push(sp.id as Id<AnyStoreStructure>);
        break;
      }
      case STRUCTURE_EXTENSION:
      case STRUCTURE_TOWER:
        fills.push(s.id as Id<AnyStoreStructure>);
        break;
      // future: STRUCTURE_STORAGE, STRUCTURE_TERMINAL, etc.
    }
  }

  cache.sourceIds = sources;
  cache.spawnIds = spawns;
  cache.fillTargetIds = fills;
  cache.controllerId = room.controller?.id ?? null;
  cache.lastScan = Game.time;
}

function refreshSites(room: Room, cache: RoomCache): void {
  cache.siteIds = room.find(FIND_MY_CONSTRUCTION_SITES).map((s) => s.id);
  cache.lastSiteScan = Game.time;
}

export function runStructureLifecycles(room: Room): void {
  const cache = getCache(room);

  // ── Refresh ──
  if (Game.time - cache.lastScan >= STRUCTURE_INTERVAL) {
    refreshStructures(room, cache);
  }
  if (Game.time - cache.lastSiteScan >= SITE_INTERVAL) {
    refreshSites(room, cache);
  }

  // ── Sources → harvest ──
  for (const id of cache.sourceIds) {
    const obj = Game.getObjectById(id);
    if (obj) new SourceLifecycle(obj).runLifecycle();
  }

  // ── Controller → upgrade ──
  if (cache.controllerId) {
    const ctrl = Game.getObjectById(cache.controllerId);
    if (ctrl) new ControllerLifecycle(ctrl).runLifecycle();
  }

  // ── Fill targets (spawn/extension/tower) → fill ──
  for (const id of cache.fillTargetIds) {
    const obj = Game.getObjectById(id);
    if (obj) runEnergyLifecycle(obj);
  }

  // ── Spawns → creep production ──
  for (const id of cache.spawnIds) {
    const obj = Game.getObjectById(id);
    if (obj) new SpawnLifecycle(obj).runLifecycle();
  }

  // ── Construction sites → build ──
  for (const id of cache.siteIds) {
    const obj = Game.getObjectById(id);
    if (obj) new SiteLifecycle(obj).runLifecycle();
  }

  // ── Workforce → spawn_req ──
  runWorkforceLifecycle(room);
}
