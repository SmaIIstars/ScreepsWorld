import { BASE_ID_ENUM, ROOM_ID_ENUM } from "@/constant";
import { getStrategy } from "@/strategy";
import { baseRole } from "../lib/base/role";

export const role = () => {
  creeps();
};

const creeps = () => {
  const creepCounter = new Map<CustomRoleType, number>([
    ["harvester", 0],
    ["builder", 0],
    ["upgrader", 0],
    ["miner", 0],
  ]);

  for (let name in Game.creeps) {
    const creep = Game.creeps[name];
    if (creep.memory.role) {
      creepCounter.set(
        creep.memory.role,
        (creepCounter.get(creep.memory.role) ?? 0) + 1
      );
      if (Game.time % 10 === 0) {
        baseRole.getVisualStatus(creep);
      }
    }
  }

  // 根据strategy创建creep, 且按顺序创建
  const strategy = getStrategy(Memory.room.rooms[ROOM_ID_ENUM.MainRoom].level);
  // 根据creepCounterMap创建creep
  const entries = creepCounter.entries();
  for (let [role, count] of entries) {
    if (count < strategy.roleMonitor[role].count) {
      const result = utils.role[role].create(BASE_ID_ENUM.MainBase, {
        body: strategy.roleMonitor[role].body,
      });
      break;
    }
  }
};
