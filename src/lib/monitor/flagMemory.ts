export const flagMonitor = () => {
  for (const flagName in Game.flags) {
    const flag = Game.flags[flagName];
    const flagType = flag.memory.type;
    if (!flagType) continue;
    if (flagType === 'sourceRoom') {
      sourceRoomMonitor(flag);
    }
  }
};

const sourceRoomMonitor = (flag: CustomFlag<'sourceRoom'>) => {
  const { payload } = flag.memory;
  const { mainRoom: mainRoomName } = payload;
  if (!mainRoomName) return;
  const mainRoom = global.rooms[mainRoomName];
  if (!mainRoom) return;
  const sourceRoom = global.rooms[flag.name];
  if (!sourceRoom) return;

  // TODO: source monitor
  // if (sourceRoom.mainRooms?.length) {
  //   global.rooms[flag.name].mainRooms = [mainRoom];
  // } else {
  //   if (!global.rooms[flag.name].mainRooms?.includes(mainRoom)) {
  //     global.rooms[flag.name].mainRooms?.push(mainRoom);
  //   }
  // }

  // if (roomMemory?.sourceRooms) {
  //   if (roomMemory.sourceRooms.includes(flag.name)) return;
  //   roomMemory.sourceRooms.push(flag.name);
  // } else {
  //   roomMemory.sourceRooms = [flag.name];
  // }
};
