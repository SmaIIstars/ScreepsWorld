import { baseRole } from "../base/role";
import harvester from "./harvester";

const run: BaseRole["run"] = (creep: Creep) => {
  if (creep.memory.task === "upgrading" && creep.store[RESOURCE_ENERGY] === 0) {
    creep.memory.task = "harvesting";
    creep.say("🔄 harvest");
  }
  if (
    creep.memory.task === "harvesting" &&
    creep.store.getFreeCapacity() === 0
  ) {
    creep.memory.task = "upgrading";
    creep.say("⚡ upgrade");
  }

  if (creep.memory.task === "harvesting") {
    harvester.run(creep, { priority: "low" });
  }

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
    body: [WORK, CARRY, MOVE, MOVE],
    role: "upgrader",
    opts: { memory: { task: "upgrading" } },
    ...spawnCreepParams,
  });
};

export default {
  run,
  create,
};
