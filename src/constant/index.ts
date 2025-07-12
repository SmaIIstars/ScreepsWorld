export enum BASE_ID_ENUM {
  MainBase = 'Spawn1',
}

export enum ROOM_ID_ENUM {
  MainRoom = 'E49S54',
  // TargetRoom, 不可见时命名为房间名
  TargetRoomFlag = 'E48S54',
  TargetRoomFlag2 = 'E48S55',
  TargetRoomFlag3 = 'E43S52',
}

export enum LINK_ID_ENUM {
  SourceLink = '687081c9e1144e042a6522ed',
  ControllerLink = '68708040889973c35ae5588f',
}

export const BASE_ID = Object.values(BASE_ID_ENUM);
