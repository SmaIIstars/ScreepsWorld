export const flagMonitor = () => {
  for (const flagName in Game.flags) {
    const flag = Game.flags[flagName];
    if (flag.memory.type === 'mainRoom') mainRoomMonitor(flag as CustomFlag<'mainRoom'>);
    else sourceRoomMonitor(flag as CustomFlag<'sourceRoom'>);
    flag.memory.time = Game.time;
  }
};

const mainRoomMonitor = (flag: CustomFlag<'mainRoom'>) => {
  const roomMemory = global.rooms[flag.name];
  const { factory } = flag.memory.payload;
  if (!roomMemory) return;
  if (factory) {
    // factory.id = roomMemory.structure?.[STRUCTURE_FACTORY] ?? '';
    // factory.storageId = roomMemory.structure?.[STRUCTURE_STORAGE] ?? '';
  }
};

const sourceRoomMonitor = (flag: CustomFlag<'sourceRoom'>) => {
  const { payload } = flag.memory;
  const { mainRoom: mainRoomName } = payload ?? {};
  if (!mainRoomName) return;
  const mainRoom = global.rooms[mainRoomName];
  if (!mainRoom) return;
  const sourceRoom = global.rooms[flag.name];
  if (!sourceRoom) return;

  sourceRoom.mainRooms?.push(mainRoomName);
  sourceRoom.mainRooms = [...new Set(sourceRoom.mainRooms)];

  mainRoom.sourceRooms?.push(flag.name);
  mainRoom.sourceRooms = [...new Set(mainRoom.sourceRooms)];
};
