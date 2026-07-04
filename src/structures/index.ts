import { SourceLifecycle } from './source';
import { ControllerLifecycle } from './controller';
import { SiteLifecycle } from './site';
import { SpawnLifecycle } from './spawn';
import { runWorkforceLifecycle } from './workforce';
import { runStoreLifecycle } from './store';
import { runContainerLifecycle } from './container';
import { TowerLifecycle } from './tower';
import { Guild } from '../core/Guild';
import { buildDedupKey } from '../core/Event';
import { refreshWorld, runCollectLifecycle, getWorldCacheForRoom, ResourceSnapshot } from './world';

interface RoomCache {
  sourceIds: Id<Source>[];
  spawnIds: Id<StructureSpawn>[];
  extensionIds: Id<StructureExtension>[];
  towerIds: Id<StructureTower>[];
  containerIds: Id<StructureContainer>[];
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
  if (cached && cached.spawnIds && cached.sourceIds) {
    if (!cached.containerIds) cached.containerIds = [];
    return cached;
  }

  const fresh: RoomCache = {
    sourceIds: [],
    spawnIds: [],
    extensionIds: [],
    towerIds: [],
    containerIds: [],
    storageIds: [],
    controllerId: null,
    siteIds: [],
    lastScan: 0,
    lastSiteScan: 0,
  };
  Memory.rooms[room.name] = fresh;
  refreshStructures(room, fresh);
  refreshSites(room, fresh);
  return fresh;
}

function refreshStructures(room: Room, cache: RoomCache): void {
  const sources: Id<Source>[] = [];
  const spawns: Id<StructureSpawn>[] = [];
  const extensions: Id<StructureExtension>[] = [];
  const towers: Id<StructureTower>[] = [];
  const containers: Id<StructureContainer>[] = [];
  const storages: Id<StructureStorage>[] = [];

  for (const s of room.find(FIND_SOURCES)) sources.push(s.id);

  for (const s of room.find(FIND_MY_STRUCTURES)) {
    switch (s.structureType) {
      case STRUCTURE_SPAWN:
        spawns.push(s.id);
        break;
      case STRUCTURE_EXTENSION:
        extensions.push(s.id);
        break;
      case STRUCTURE_TOWER:
        towers.push(s.id);
        break;
      case STRUCTURE_STORAGE:
        storages.push(s.id);
        break;
      default:
        break;
    }
  }

  // Containers are neutral — need FIND_STRUCTURES
  for (const s of room.find(FIND_STRUCTURES, {
    filter: (s) => s.structureType === STRUCTURE_CONTAINER,
  })) {
    containers.push(s.id);
  }

  cache.sourceIds = sources;
  cache.spawnIds = spawns;
  cache.extensionIds = extensions;
  cache.towerIds = towers;
  cache.containerIds = containers;
  cache.storageIds = storages;
  cache.controllerId = room.controller?.id ?? null;
  cache.lastScan = Game.time;
}

function refreshSites(room: Room, cache: RoomCache): void {
  cache.siteIds = room.find(FIND_MY_CONSTRUCTION_SITES).map((s) => s.id);
  cache.lastSiteScan = Game.time;
}

const REPAIR_SCAN_INTERVAL = 20;
let lastRepairScan = 0;

function repairStructures(room: Room): void {
  if (Game.time - lastRepairScan < REPAIR_SCAN_INTERVAL) return;
  lastRepairScan = Game.time;

  const structures = room.find(FIND_STRUCTURES, {
    filter: (s) =>
      s.structureType === STRUCTURE_ROAD ||
      s.structureType === STRUCTURE_RAMPART ||
      s.structureType === STRUCTURE_WALL,
  });

  const seenIds = new Set<string>();

  for (const s of structures) {
    const id = s.id as string;
    seenIds.add(id);

    const ratio = s.hits / s.hitsMax;

    // Wall and Rampart: cap at 100k hits
    if (s.structureType === STRUCTURE_WALL || s.structureType === STRUCTURE_RAMPART) {
      if (s.hits >= 100000) continue;
    }

    if (ratio >= 0.5) continue;

    const priority =
      s.structureType === STRUCTURE_ROAD ? 50 :
      s.structureType === STRUCTURE_RAMPART ? 30 : 25;

    Guild.post({
      type: 'repair',
      room: room.name,
      targetId: s.id,
      requiredTags: ['work', 'move'],
      requiredCapacities: { work: 1, carry: 50 },
      priority,
      maxWorkers: 1,
      publisherType: s.structureType as string,
      data: { targetId: s.id },
    });
  }

  // Cancel repair events for structures no longer needing repair
  const roomEvents = Guild._events[room.name];
  if (roomEvents) {
    for (const key in roomEvents) {
      const evt = roomEvents[key];
      if (evt.type !== 'repair') continue;
      if (evt.publisherType === 'tower' || evt.publisherType === 'container') continue;
      if (!seenIds.has(evt.targetId)) {
        Guild.cancel(evt.dedupKey);
      }
    }
  }
}

export function runStructureLifecycles(room: Room): void {
  const cache = getCache(room);

  if (Game.time - cache.lastScan >= STRUCTURE_INTERVAL) refreshStructures(room, cache);
  if (Game.time - cache.lastSiteScan >= SITE_INTERVAL) refreshSites(room, cache);

  // ── World (neutral objects + hostiles) — every SCAN_INTERVAL ticks ──
  const worldCache = getWorldCacheForRoom(room);
  if (Game.time - worldCache.lastScan >= 20) {
    refreshWorld(room, worldCache);
  }

  // ── Road / Rampart / Wall repair scan ──
  repairStructures(room);

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

  // Towers → fill + attack/heal/defend + repair events
  for (const id of cache.towerIds) {
    const obj = Game.getObjectById(id);
    if (obj) new TowerLifecycle(obj).runLifecycle();
  }

  // Storage → fill (future: resource balancing)
  for (const id of cache.storageIds) {
    const obj = Game.getObjectById(id);
    if (obj) runStoreLifecycle(obj);
  }

  // Containers → harvest (has energy) + fill (has space)
  for (const id of cache.containerIds) {
    const obj = Game.getObjectById(id);
    if (obj) runContainerLifecycle(obj);
  }

  // ── World collect targets (dropped/tombs/ruins) ──
  for (const id in worldCache.resources) {
    runCollectLifecycle(worldCache.resources[id], id, room);
  }
  for (const id in worldCache.tombs) {
    runCollectLifecycle(worldCache.tombs[id], id, room);
  }
  for (const id in worldCache.ruins) {
    runCollectLifecycle(worldCache.ruins[id], id, room);
  }

  // Sites → build
  for (const id of cache.siteIds) {
    const obj = Game.getObjectById(id);
    if (obj) new SiteLifecycle(obj).runLifecycle();
  }

  // Workforce → spawn_req
  runWorkforceLifecycle(room);
}
