export enum BASE_ID_ENUM {
  MainBase = 'Spawn1',
  MainBase2 = 'Spawn2',
  MainBase3 = 'Spawn3',
}

export enum ROOM_ID_ENUM {
  MainRoom = 'E11N14',
  // MainRoom2 = 'E43S52',
  // // TargetRoom, 不可见时命名为房间名
  // TargetRoomFlag = 'E48S54',
  // TargetRoomFlag2 = 'E48S55',
  // TargetRoomFlag3 = 'E43S52',
  // TargetRoomFlag4 = 'E49S53',
}

export enum LINK_ID_ENUM {
  SourceLink = '687081c9e1144e042a6522ed',
  ControllerLink = '68708040889973c35ae5588f',
}

export const BASE_ID = Object.values(BASE_ID_ENUM);

export type EnergyStoreType =
  | 'deposit'
  | 'mineral'
  | 'source'
  | 'miner'
  | 'container'
  | 'storage'
  | 'ruin'
  | 'tombstone'
  | 'resource'
  | 'link'
  | 'terminal';

export type EnergyStoreTargetType =
  | Creep
  | StructureStorage
  | StructureContainer
  | Mineral
  | Source
  | Ruin
  | Tombstone
  | Resource
  | StructureLink
  | StructureTerminal
  | null;
