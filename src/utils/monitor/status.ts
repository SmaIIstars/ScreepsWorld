import { intervalSleep } from '..';

const statusMain = () => {
  intervalSleep(10, spawnStatus);
};

const spawnStatus = () => {
  const spawns = Object.values(Game.spawns);
  for (const spawn of spawns) {
    if (spawn.spawning) {
      spawn.room.visual.text(
        `Spawning:${spawn.spawning.name}`,
        { ...spawn.pos, y: spawn.pos.y - 1 },
        {
          font: 0.5,
          color: '#00ff00',
          stroke: '#000000',
          strokeWidth: 0.1,
        }
      );
    } else {
      spawn.room.visual.text(
        `${spawn.store[RESOURCE_ENERGY]}`,
        { ...spawn.pos, y: spawn.pos.y + 1 },
        {
          font: 0.5,
          color: '#00ff00',
          stroke: '#000000',
          strokeWidth: 0.1,
        }
      );
    }
  }
};

// const miner = () => {
//   const sources = Object.values(Memory.resources)
//     .filter((resource) => resource.source instanceof Source)
//     .map((resource) => resource.source as Source);

//   const curRoom = Game.rooms[ROOM_ID_ENUM.MainRoom];
//   if (!sources.length || !curRoom) return;
//   // 查找资源周围可用空间
//   const allAvailablePositions = sources.reduce<Array<{ x: number; y: number }>>((acc, source) => {
//     const positions = queryAvailableGetSourcePositions(source.pos.x, source.pos.y);
//     if (positions) return [...acc, ...positions];
//     return acc;
//   }, []);

//   for (const position of allAvailablePositions) {
//     curRoom.visual.circle(position.x, position.y, {
//       fill: 'transparent',
//       radius: 0.55,
//       stroke: 'red',
//     });
//   }
// };

export { statusMain };

// Game.map.visual.circle(new RoomPosition(7,42,'E49S54'), { fill: "red", stroke: "blue" });
