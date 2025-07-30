// export const remoteFlagMonitor = () => {
//   for (const flagName in Game.flags) {
//     const flag = Game.flags[flagName];

//     if (flag.memory.type === 'remoteRoom') {
//       const config = flag.memory.remoteRoomConfig;
//       if (!config || config.status !== 'active') continue;

//       // 初始化全局外矿信息
//       if (!global.remoteRooms) {
//         global.remoteRooms = {};
//       }

//       global.remoteRooms[flagName] = {
//         flagName,
//         roomName: flag.pos.roomName,
//         baseRoom: config.baseRoom,
//         priority: config.priority,
//         maxHarvesters: config.maxHarvesters,
//         maxHaulers: config.maxHaulers,
//         autoDefense: config.autoDefense,
//         assignedCreeps: getAssignedCreeps(flagName),
//         lastUpdate: Game.time,
//       };

//       // 更新基地房间的外矿列表
//       if (!global.rooms[config.baseRoom]) {
//         global.rooms[config.baseRoom] = {};
//       }
//       if (!global.rooms[config.baseRoom].remoteRooms) {
//         global.rooms[config.baseRoom].remoteRooms = [];
//       }

//       if (!global.rooms[config.baseRoom].remoteRooms.includes(flagName)) {
//         global.rooms[config.baseRoom].remoteRooms.push(flagName);
//       }
//     }
//   }
// };

// const getAssignedCreeps = (flagName: string): string[] => {
//   return Object.values(Game.creeps)
//     .filter(creep => creep.memory.assignedFlag === flagName)
//     .map(creep => creep.name);
// };
