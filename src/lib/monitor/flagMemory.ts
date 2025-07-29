export const flagMonitor = () => {
  for (const flagName in Game.flags) {
    const flag = Game.flags[flagName];
    if (flag.memory.type === 'sourceRoom') {
      if (!flag.memory.mainRooms) continue;

      flag.memory.mainRooms.forEach((roomName) => {
        if (!global.rooms[roomName]?.sourceRooms) {
          global.rooms[roomName].sourceRooms = [];
        } else {
          global.rooms[roomName].sourceRooms?.push(flagName);
        }
      });
    }
  }
};
