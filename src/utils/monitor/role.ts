import { baseRole } from "../lib/base/role";

const MIN_ROLE_COUNT_PER_TYPE: Record<CustomRoleType, { count: number }> = {
  harvester: { count: 8 },
  builder: { count: 2 },
  upgrader: { count: 6 },
  miner: { count: 4 },
};

export const role = () => {
  creeps();
};

const creeps = () => {
  const creepCount: Record<CustomRoleType, number> = {
    harvester: 0,
    builder: 0,
    upgrader: 0,
    miner: 0,
  };

  for (let name in Game.creeps) {
    const creep = Game.creeps[name];
    if (creep.memory.role) {
      creepCount[creep.memory.role] = (creepCount[creep.memory.role] || 0) + 1;
      if (Game.time % 10 === 0) {
        baseRole.getVisualStatus(creep);
      }
    }
  }

  for (let role of Object.keys(creepCount) as CustomRoleType[]) {
    if (creepCount[role] < MIN_ROLE_COUNT_PER_TYPE[role].count) {
      utils.role[role].create("Main Base");
    }
  }
};
