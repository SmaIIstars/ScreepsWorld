import { BASE_ID_ENUM, ROOM_ID_ENUM } from "@/constant";
import { getStrategy } from "@/strategy";
import { intervalTime } from "..";
import { baseRole } from "../lib/base/role";

export const generatorRole = () => {
  creeps();
};

const creeps = () => {
  const creepCounter = new Map<CustomRoleType, number>([
    ["miner", 0],
    ["harvester", 0],
    ["minerStore", 0],
    ["builder", 0],
    ["upgrader", 0],
  ]);

  for (let name in Game.creeps) {
    const creep = Game.creeps[name];
    if (creep.memory.role) {
      creepCounter.set(
        creep.memory.role,
        (creepCounter.get(creep.memory.role) ?? 0) + 1
      );
      intervalTime(10, () => baseRole.getVisualStatus(creep));
    }
  }

  const strategy = getStrategy(Memory.rooms[ROOM_ID_ENUM.MainRoom].level);
  // 根据creepCounterMap创建creep
  const entries = creepCounter.entries();
  for (let [role, count] of entries) {
    if (!strategy.roleMonitor[role]) continue;
    if (count < strategy.roleMonitor[role].count) {
      console.log("generatorRole", role);
      const result = utils.role[role].create(BASE_ID_ENUM.MainBase, {
        body: strategy.roleMonitor[role].body,
      });
      break;
    }
  }
};
