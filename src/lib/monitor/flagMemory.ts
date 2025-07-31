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
  if (!payload) {
    const defaultPayload: Partial<RemoteSourceRoomPayload> = {
      remoteHarvesters: 1,
      remoteMiners: 1,
      remoteClaimers: 1,
      status: 'active',
    };
    flag.memory.payload = defaultPayload;
  } else {
    const { mainRoom } = payload;
    if (!mainRoom) return;
    const room = Game.rooms[mainRoom];
    if (!room) return;

    if (Game.rooms[flag.pos.roomName]) {
      if (!Game.rooms[flag.pos.roomName].memory.mainRooms?.length) {
        Game.rooms[flag.pos.roomName].memory.mainRooms = [mainRoom];
      } else {
        if (!Game.rooms[flag.pos.roomName].memory.mainRooms?.includes(mainRoom)) {
          Game.rooms[flag.pos.roomName].memory.mainRooms?.push(mainRoom);
        }
      }
    }

    if (room.memory?.sourceRooms) {
      if (room.memory.sourceRooms.includes(flag.pos.roomName)) return;
      room.memory.sourceRooms.push(flag.pos.roomName);
    } else {
      room.memory.sourceRooms = [flag.pos.roomName];
    }
  }
};
