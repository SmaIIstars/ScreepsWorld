import { intervalSleep } from '..';

const statusMain = () => {
  intervalSleep(10, spawnStatus);
};

const spawnStatus = () => {
  const spawns = Object.values(Game.spawns);
  for (const spawn of spawns) {
    if (spawn?.spawning) {
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

export { statusMain };

// Game.map.visual.circle(new RoomPosition(7,42,'E49S54'), { fill: "red", stroke: "blue" });
