// Minimal Screeps global type declarations
// Restore full types by running: pnpm install

declare global {
  // Constants
  const OK: 0;
  const ERR_NOT_OWNER: -1;
  const ERR_NO_PATH: -2;
  const ERR_NAME_EXISTS: -3;
  const ERR_BUSY: -4;
  const ERR_NOT_FOUND: -5;
  const ERR_NOT_ENOUGH_RESOURCES: -6;
  const ERR_INVALID_TARGET: -7;
  const ERR_FULL: -8;
  const ERR_NOT_IN_RANGE: -9;
  const ERR_INVALID_ARGS: -10;
  const ERR_TIRED: -11;
  const ERR_NO_BODYPART: -12;
  const ERR_NOT_ENOUGH_EXTENSIONS: -13;
  const ERR_RCL_NOT_ENOUGH: -14;
  const ERR_GCL_NOT_ENOUGH: -15;

  const FIND_EXIT_TOP: 1;
  const FIND_EXIT_RIGHT: 3;
  const FIND_EXIT_BOTTOM: 5;
  const FIND_EXIT_LEFT: 7;
  const FIND_EXIT: 10;
  const FIND_CREEPS: 101;
  const FIND_MY_CREEPS: 102;
  const FIND_HOSTILE_CREEPS: 103;
  const FIND_SOURCES_ACTIVE: 104;
  const FIND_SOURCES: 105;
  const FIND_DROPPED_RESOURCES: 106;
  const FIND_STRUCTURES: 107;
  const FIND_MY_STRUCTURES: 108;
  const FIND_HOSTILE_STRUCTURES: 109;
  const FIND_FLAGS: 110;
  const FIND_CONSTRUCTION_SITES: 111;
  const FIND_MY_CONSTRUCTION_SITES: 112;
  const FIND_HOSTILE_CONSTRUCTION_SITES: 113;
  const FIND_MINERALS: 114;
  const FIND_NUKES: 117;
  const FIND_TOMBSTONES: 118;
  const FIND_POWER_CREEPS: 119;
  const FIND_MY_POWER_CREEPS: 120;
  const FIND_HOSTILE_POWER_CREEPS: 121;
  const FIND_DEPOSITS: 122;
  const FIND_RUINS: 123;

  const RESOURCE_ENERGY: 'energy';

  const TOP: 1;
  const TOP_RIGHT: 2;
  const RIGHT: 3;
  const BOTTOM_RIGHT: 4;
  const BOTTOM: 5;
  const BOTTOM_LEFT: 6;
  const LEFT: 7;
  const TOP_LEFT: 8;

  const MOVE: 'move';
  const WORK: 'work';
  const CARRY: 'carry';
  const ATTACK: 'attack';
  const RANGED_ATTACK: 'ranged_attack';
  const HEAL: 'heal';
  const CLAIM: 'claim';
  const TOUGH: 'tough';

  const STRUCTURE_SPAWN: 'spawn';
  const STRUCTURE_EXTENSION: 'extension';
  const STRUCTURE_ROAD: 'road';
  const STRUCTURE_WALL: 'constructedWall';
  const STRUCTURE_RAMPART: 'rampart';
  const STRUCTURE_LINK: 'link';
  const STRUCTURE_STORAGE: 'storage';
  const STRUCTURE_TOWER: 'tower';
  const STRUCTURE_OBSERVER: 'observer';
  const STRUCTURE_POWER_SPAWN: 'powerSpawn';
  const STRUCTURE_EXTRACTOR: 'extractor';
  const STRUCTURE_LAB: 'lab';
  const STRUCTURE_TERMINAL: 'terminal';
  const STRUCTURE_CONTAINER: 'container';
  const STRUCTURE_NUKER: 'nuker';
  const STRUCTURE_FACTORY: 'factory';
  const STRUCTURE_INVADER_CORE: 'invaderCore';
  const STRUCTURE_KEEPER_LAIR: 'keeperLair';
  const STRUCTURE_PORTAL: 'portal';
  const STRUCTURE_POWER_BANK: 'powerBank';

  // Types
  type BodyPartConstant = MOVE | WORK | CARRY | ATTACK | RANGED_ATTACK | HEAL | CLAIM | TOUGH | 'tough';

  interface BodyPartDefinition {
    type: BodyPartConstant;
    hits: number;
  }

  type ScreepsReturnCode = 0 | -1 | -2 | -3 | -4 | -5 | -6 | -7 | -8 | -9 | -10 | -11 | -12 | -13 | -14 | -15;

  interface RoomPosition {
    x: number;
    y: number;
    roomName: string;
    findClosestByPath<T>(type: number): T | null;
    findInRange<T>(type: number, range: number): T[];
    getRangeTo(target: RoomPosition | { pos: RoomPosition }): number;
    isNearTo(target: RoomPosition | { pos: RoomPosition }): boolean;
    inRangeTo(target: RoomPosition | { pos: RoomPosition }, range: number): boolean;
  }

  interface StoreDefinition {
    getCapacity(resource?: string): number | null;
    getUsedCapacity(resource?: string): number;
    [resource: string]: number | ((resource?: string) => number | null);
  }

  interface Creep {
    name: string;
    body: BodyPartDefinition[];
    store: { energy: number; getFreeCapacity(resource?: string): number; [key: string]: any };
    memory: any;
    room: Room;
    spawning: boolean;
    pos: RoomPosition;
    harvest(target: Source | Mineral): ScreepsReturnCode;
    transfer(target: Creep | Structure, resourceType: string, amount?: number): ScreepsReturnCode;
    upgradeController(controller: StructureController): ScreepsReturnCode;
    build(target: ConstructionSite): ScreepsReturnCode;
    repair(target: Structure): ScreepsReturnCode;
    moveTo(target: RoomPosition | { pos: RoomPosition }, opts?: any): ScreepsReturnCode;
    attack(target: Creep | Structure): ScreepsReturnCode;
    rangedAttack(target: Creep | Structure): ScreepsReturnCode;
    heal(target: Creep): ScreepsReturnCode;
    rangedHeal(target: Creep): ScreepsReturnCode;
    move(direction: number): ScreepsReturnCode;
    pickup(target: Resource): ScreepsReturnCode;
    withdraw(target: Structure, resourceType: string, amount?: number): ScreepsReturnCode;
    drop(resourceType: string, amount?: number): ScreepsReturnCode;
    suicide(): ScreepsReturnCode;
    getActiveBodyparts(type: BodyPartConstant): number;
    ticksToLive: number;
    fatigue: number;
    hits: number;
    hitsMax: number;
  }

  interface Room {
    name: string;
    controller?: StructureController;
    storage?: StructureStorage;
    terminal?: StructureTerminal;
    energyAvailable: number;
    energyCapacityAvailable: number;
    memory: any;
    find<T>(type: number, opts?: any): T[];
    lookAt(x: number, y: number): LookAtResult[];
    lookForAt(type: string, x: number, y: number): any[];
    lookAtArea(top: number, left: number, bottom: number, right: number, asArray?: boolean): any;
    getPositionAt(x: number, y: number): RoomPosition | null;
    visual: RoomVisual;
  }

  interface Source {
    id: string;
    energy: number;
    energyCapacity: number;
    pos: RoomPosition;
    room: Room;
    ticksToRegeneration: number;
  }

  interface Mineral {
    id: string;
    pos: RoomPosition;
    room: Room;
    mineralType: string;
    mineralAmount: number;
  }

  interface Structure {
    id: string;
    room: Room;
    pos: RoomPosition;
    structureType: string;
    hits: number;
    hitsMax: number;
    destroy(): ScreepsReturnCode;
    isActive(): boolean;
  }

  interface OwnedStructure extends Structure {
    my: boolean;
    owner: { username: string };
  }

  interface StructureController extends OwnedStructure {
    level: number;
    progress: number;
    progressTotal: number;
    ticksToDowngrade: number;
    reservation?: { username: string; ticksToEnd: number };
    activateSafeMode(): ScreepsReturnCode;
    unclaim(): ScreepsReturnCode;
  }

  interface StructureSpawn extends OwnedStructure {
    name: string;
    energy: number;
    energyCapacity: number;
    spawning: Spawning | null;
    spawnCreep(body: BodyPartConstant[], name: string, opts?: any): ScreepsReturnCode;
    renewCreep(target: Creep): ScreepsReturnCode;
    recycleCreep(target: Creep): ScreepsReturnCode;
  }

  interface StructureStorage extends OwnedStructure {
    store: any;
  }

  interface StructureTerminal extends OwnedStructure {
    store: any;
    cooldown: number;
    send(resourceType: string, amount: number, roomName: string): ScreepsReturnCode;
  }

  interface StructureTower extends OwnedStructure {
    energy: number;
    energyCapacity: number;
    store: any;
    attack(target: Creep): ScreepsReturnCode;
    heal(target: Creep): ScreepsReturnCode;
    repair(target: Structure): ScreepsReturnCode;
  }

  interface StructureLink extends OwnedStructure {
    energy: number;
    energyCapacity: number;
    cooldown: number;
    transferEnergy(target: StructureLink, amount?: number): ScreepsReturnCode;
  }

  interface StructureLab extends OwnedStructure {
    energy: number;
    mineralType: string;
    mineralAmount: number;
    cooldown: number;
    runReaction(lab1: StructureLab, lab2: StructureLab): ScreepsReturnCode;
    boostCreep(creep: Creep, bodyPartsCount?: number): ScreepsReturnCode;
  }

  interface StructureFactory extends OwnedStructure {
    cooldown: number;
    produce(resourceType: string): ScreepsReturnCode;
  }

  interface StructureNuker extends OwnedStructure {
    energy: number;
    energyCapacity: number;
    ghodium: number;
    ghodiumCapacity: number;
    cooldown: number;
    launchNuke(pos: RoomPosition): ScreepsReturnCode;
  }

  interface StructureObserver extends OwnedStructure {
    observeRoom(roomName: string): ScreepsReturnCode;
  }

  interface StructureRampart extends OwnedStructure {
    isPublic: boolean;
    setPublic(isPublic: boolean): void;
  }

  interface StructureRoad extends Structure { }
  interface StructureWall extends Structure { }
  interface StructureContainer extends OwnedStructure {
    store: any;
  }
  interface StructurePowerSpawn extends OwnedStructure {
    energy: number;
    power: number;
    processPower(): ScreepsReturnCode;
  }
  interface StructureExtractor extends OwnedStructure { }
  interface StructureInvaderCore extends OwnedStructure { }
  interface StructureKeeperLair extends Structure {
    ticksToSpawn?: number;
  }
  interface StructurePortal extends Structure {
    destination: RoomPosition | { room: string };
    ticksToDecay?: number;
  }
  interface StructurePowerBank extends Structure {
    power: number;
    ticksToDecay: number;
  }

  interface ConstructionSite {
    id: string;
    pos: RoomPosition;
    room: Room;
    structureType: string;
    progress: number;
    progressTotal: number;
    my: boolean;
    owner: { username: string };
    remove(): ScreepsReturnCode;
  }

  interface Resource {
    id: string;
    pos: RoomPosition;
    room: Room;
    resourceType: string;
    amount: number;
  }

  interface Tombstone {
    id: string;
    pos: RoomPosition;
    room: Room;
    deathTime: number;
    store: any;
    creep: any;
  }

  interface Ruin {
    id: string;
    pos: RoomPosition;
    room: Room;
    destroyTime: number;
    store: any;
  }

  interface Flag {
    name: string;
    color: number;
    secondaryColor: number;
    pos: RoomPosition;
    room: Room | undefined;
    memory: any;
    setPosition(pos: RoomPosition): void;
    setColor(color: number, secondaryColor?: number): void;
    remove(): void;
  }

  interface Spawning {
    name: string;
    needTime: number;
    remainingTime: number;
    spawn: StructureSpawn;
    cancel(): ScreepsReturnCode;
    setDirections(directions: number[]): ScreepsReturnCode;
  }

  interface RoomVisual {
    line(x1: number, y1: number, x2: number, y2: number, style?: any): RoomVisual;
    circle(x: number, y: number, style?: any): RoomVisual;
    text(text: string, x: number, y: number, style?: any): RoomVisual;
    rect(x: number, y: number, w: number, h: number, style?: any): RoomVisual;
    poly(points: number[][], style?: any): RoomVisual;
    clear(): RoomVisual;
  }

  interface LookAtResult {
    type: string;
    creep?: Creep;
    structure?: Structure;
    terrain?: string;
  }

  interface Game {
    creeps: Record<string, Creep>;
    rooms: Record<string, Room>;
    spawns: Record<string, StructureSpawn>;
    structures: Record<string, Structure>;
    flags: Record<string, Flag>;
    constructionSites: Record<string, ConstructionSite>;
    time: number;
    cpu: { getUsed(): number; limit: number; tickLimit: number; bucket: number };
    gcl: { level: number; progress: number; progressTotal: number };
    gpl: { level: number; progress: number; progressTotal: number };
    map: Map;
    market: any;
    powerCreeps: Record<string, PowerCreep>;
    shard: Shard;
    getObjectById<T>(id: string): T | null;
    notify(message: string, groupInterval?: number): void;
  }

  interface Memory {
    creeps: Record<string, any>;
    rooms: Record<string, any>;
    flags: Record<string, any>;
    spawns: Record<string, any>;
    powerCreeps: Record<string, any>;
    [key: string]: any;
  }

  interface PowerCreep {
    name: string;
    pos: RoomPosition;
    room: Room;
    powers: Record<string, any>;
    level: number;
  }

  interface Map {
    getRoomStatus(roomName: string): { status: string } | null;
    getRoomTerrain(roomName: string): any;
    getRoomLinearDistance(roomName1: string, roomName2: string): number;
    describeExits(roomName: string): Record<string, string> | null;
    findRoute(fromRoom: string, toRoom: string, opts?: any): any[];
    getWorldSize(): number;
  }

  interface Shard {
    name: string;
    type: string;
    ptr: boolean;
  }

  var Game: Game;
  var Memory: Memory;
}

export {};
