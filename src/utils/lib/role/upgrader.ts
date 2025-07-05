import { baseRole } from "../base/role";
import harvester from "./harvester";

const run: BaseRole["run"] = (creep: Creep) => {
  // 1. 如果creep的store.energy === 0 且正在执行升级任务, 则切换到采集任务
  if (creep.memory.task === "upgrading" && creep.store[RESOURCE_ENERGY] === 0) {
    creep.say("🔄 harvest");
    creep.memory.task = "harvesting";
  }

  // 2. 如果creep的store.getFreeCapacity() === 0 且正在执行采集任务, 则切换到升级任务
  if (
    creep.memory.task === "harvesting" &&
    creep.store.getFreeCapacity() === 0
  ) {
    creep.memory.task = "upgrading";
    creep.say("⚡ upgrade");
  }

  // 3. 执行采集任务
  if (creep.memory.task === "harvesting") {
    const miners = creep.room.find(FIND_MY_CREEPS, {
      filter: (c) => c.memory.role === "miner" && c.store[RESOURCE_ENERGY] > 0,
    });

    harvester.run(creep, { priority: "low" });
  }

  // 4. 执行升级任务
  if (creep.memory.task === "upgrading") {
    if (
      creep.room.controller &&
      creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE
    ) {
      creep.moveTo(creep.room.controller, {
        visualizePathStyle: { stroke: "#ffffff" },
      });
    }
  }
};

const create: BaseRole["create"] = (baseId?: string, spawnCreepParams = {}) => {
  return baseRole.create({
    baseId,
    body: [WORK, CARRY, CARRY, MOVE, MOVE],
    role: "upgrader",
    opts: { memory: { task: "upgrading" } },
    ...spawnCreepParams,
  });
};

export default {
  run,
  create,
};
