import { SourceLifecycle } from './source';
import { ControllerLifecycle } from './controller';
import { SiteLifecycle } from './site';
import { SpawnLifecycle } from './spawn';
import { runWorkforceLifecycle } from './workforce';
import { runStoreLifecycle } from './store';

interface RoomCache {
  sourceIds: Id<Source>[];
  spawnIds: Id<StructureSpawn>[];
  extensionIds: Id<StructureExtension>[];
  towerIds: Id<StructureTower>[];
  storageIds: Id<StructureStorage>[];
  controllerId: Id<StructureController> | null;
  siteIds: Id<ConstructionSite>[];
  lastScan: number;
  lastSiteScan: number;
}

const STRUCTURE_INTERVAL = 20;
const SITE_INTERVAL = 5;

function getCache(room: Room): RoomCache {
  if (!Memory.rooms) Memory.rooms = {};
  const cached = Memory.rooms[room.name] as RoomCache | undefined;
  if (cached && cached.spawnIds && cached.sourceIds) return cached;

  const fresh: RoomCache = {
    sourceIds: [],
    spawnIds: [],
    extensionIds: [],
    towerIds: [],
    storageIds: [],
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
  const extensions: Id<StructureExtension>[] = [];
  const towers: Id<StructureTower>[] = [];
  const storages: Id<StructureStorage>[] = [];

  for (const s of room.find(FIND_SOURCES)) sources.push(s.id);

  for (const s of room.find(FIND_MY_STRUCTURES)) {
    switch (s.structureType) {
      case STRUCTURE_SPAWN:     spawns.push(s.id); break;
      case STRUCTURE_EXTENSION: extensions.push(s.id); break;
      case STRUCTURE_TOWER:     towers.push(s.id); break;
      case STRUCTURE_STORAGE:   storages.push(s.id); break;
      default: break; // container, link, terminal, etc. — skip for now
    }
  }

  cache.sourceIds = sources;
  cache.spawnIds = spawns;
  cache.extensionIds = extensions;
  cache.towerIds = towers;
  cache.storageIds = storages;
  cache.controllerId = room.controller?.id ?? null;
  cache.lastScan = Game.time;
}

function refreshSites(room: Room, cache: RoomCache): void {
  cache.siteIds = room.find(FIND_MY_CONSTRUCTION_SITES).map((s) => s.id);
  cache.lastSiteScan = Game.time;
}

export function runStructureLifecycles(room: Room): void {
  const cache = getCache(room);

  if (Game.time - cache.lastScan >= STRUCTURE_INTERVAL) refreshStructures(room, cache);
  if (Game.time - cache.lastSiteScan >= SITE_INTERVAL) refreshSites(room, cache);

  // Sources → harvest
  for (const id of cache.sourceIds) {
    const obj = Game.getObjectById(id);
    if (obj) new SourceLifecycle(obj).runLifecycle();
  }

  // Controller → upgrade
  if (cache.controllerId) {
    const obj = Game.getObjectById(cache.controllerId);
    if (obj) new ControllerLifecycle(obj).runLifecycle();
  }

  // Spawns → fill + spawn
  for (const id of cache.spawnIds) {
    const obj = Game.getObjectById(id);
    if (obj) new SpawnLifecycle(obj).runLifecycle();
  }

  // Extensions → fill
  for (const id of cache.extensionIds) {
    const obj = Game.getObjectById(id);
    if (obj) runStoreLifecycle(obj);
  }

  // Towers → fill
  for (const id of cache.towerIds) {
    const obj = Game.getObjectById(id);
    if (obj) runStoreLifecycle(obj);
  }

  // Storage → fill (future: resource balancing)
  for (const id of cache.storageIds) {
    const obj = Game.getObjectById(id);
    if (obj) runStoreLifecycle(obj);
  }

  // Sites → build
  for (const id of cache.siteIds) {
    const obj = Game.getObjectById(id);
    if (obj) new SiteLifecycle(obj).runLifecycle();
  }

  // Workforce → spawn_req
  runWorkforceLifecycle(room);
}
