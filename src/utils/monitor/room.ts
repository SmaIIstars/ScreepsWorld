export const room = () => {
  if (Game.time % 50 === 0) {
    rooms();
    // task.run();
  }
};

const rooms = () => {
  const roomMap: Record<string, CustomRoomType> = {};
  for (let key in Game.rooms) {
    const room = Game.rooms[key];
    roomMap[key] = {
      ...room,
      level: room.controller?.level ?? 1,
    };
  }

  Memory.room = {
    rooms: roomMap,
  };
};
