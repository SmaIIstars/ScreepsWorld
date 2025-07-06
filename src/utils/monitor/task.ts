// Memory 只能存string, number, boolean, 简单的 object, array，null. 不能缓存 Function

import { BASE_ID_ENUM } from "@/constant";

const task = () => {
  // MinerStore-1 去5,41 采集
  const minerStore1 = Game.creeps["MinerStore-1"];
  if (minerStore1) {
    minerStore1.moveTo(6, 40);
  } else {
    Game.spawns[BASE_ID_ENUM.MainBase].spawnCreep(
      [
        CARRY,
        CARRY,
        CARRY,
        CARRY,
        CARRY,
        CARRY,
        CARRY,
        CARRY,
        CARRY,
        CARRY,
        MOVE,
      ],
      "MinerStore-1",
      { memory: { role: "minerStore" } }
    );
  }

  const minerStore2 = Game.creeps["MinerStore-2"];
  if (minerStore2) {
    minerStore2.moveTo(5, 39);
  } else {
    Game.spawns[BASE_ID_ENUM.MainBase].spawnCreep(
      [
        CARRY,
        CARRY,
        CARRY,
        CARRY,
        CARRY,
        CARRY,
        CARRY,
        CARRY,
        CARRY,
        CARRY,
        MOVE,
      ],
      "MinerStore-2",
      { memory: { role: "minerStore" } }
    );
  }

  const minerStore3 = Game.creeps["MinerStore-3"];
  if (minerStore3) {
    minerStore3.moveTo(11, 43);
  } else {
    Game.spawns[BASE_ID_ENUM.MainBase].spawnCreep(
      [
        CARRY,
        CARRY,
        CARRY,
        CARRY,
        CARRY,
        CARRY,
        CARRY,
        CARRY,
        CARRY,
        CARRY,
        MOVE,
      ],
      "MinerStore-3",
      { memory: { role: "minerStore" } }
    );
  }
};

export { task };
