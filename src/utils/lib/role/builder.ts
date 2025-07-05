import { baseRole } from "../base/role";
import harvester from "./harvester";

const run: BaseRole["run"] = (creep: Creep, opts = {}) => {
  const constructionSites = creep.room.find(FIND_MY_CONSTRUCTION_SITES);

  if (constructionSites.length === 0) {
    harvester.run(creep, opts);
    creep.memory.task = "idle";
    return;
  }

  if (creep.memory.task === "building" && creep.store[RESOURCE_ENERGY] === 0) {
    if (Game.time % 10 === 0) creep.say("🔄 harvest");
    creep.memory.task = "harvesting";
  }

  if (
    creep.memory.task === "harvesting" &&
    creep.store.getFreeCapacity() === 0
  ) {
    if (Game.time % 10 === 0) creep.say("🚧 build");
    creep.memory.task = "building";
  }

  if (creep.memory.task === "harvesting") {
    harvester.run(creep, opts);
  }

  if (creep.memory.task === "building") {
    const needToBuild = constructionSites.filter(
      (site) => site.progress < site.progressTotal
    );

    if (needToBuild.length === 0) {
      creep.memory.task = "harvesting";
      return;
    }

    if (creep.build(needToBuild[0]) === ERR_NOT_IN_RANGE) {
      creep.moveTo(needToBuild[0], {
        visualizePathStyle: { stroke: "#ffffff" },
      });
    }
  }
};

const create: BaseRole["create"] = (baseId?: string, spawnCreepParams = {}) => {
  return baseRole.create({
    baseId,
    body: [WORK, WORK, CARRY, CARRY, MOVE, MOVE],
    role: "builder",
    opts: { memory: { task: "building" } },
    ...spawnCreepParams,
  });
};

export default {
  run,
  create,
};
