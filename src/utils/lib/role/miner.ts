import { baseRole } from "../base/role";

const run: BaseRole["run"] = (creep: Creep) => {
  let targetResource: Source | null = null;
  if (!creep.memory.targetSourceId) {
    const availableResources = Object.values(Memory.resources)
      .filter(
        (resource) =>
          resource.source instanceof Source &&
          resource.source.energy > 0 &&
          resource.source.ticksToRegeneration < 300 &&
          resource.creepsNearSource.length < resource.availablePositions.length
      )
      .map((resource) => resource.source as Source);
    targetResource = availableResources.pop() ?? null;
    creep.memory.targetSourceId = targetResource?.id;
  } else {
    targetResource = Memory.resources[creep.memory.targetSourceId]
      ?.source as Source | null;
  }
  if (!targetResource) return;

  if (creep.memory.task === "mining") {
    const harvestResult = creep.harvest(targetResource);
    if (harvestResult === OK) {
      if (Game.time % 10 === 0) creep.say("⛏️ Mining");
    } else if (harvestResult === ERR_NOT_ENOUGH_RESOURCES) {
      if (Game.time % 10 === 0) creep.say("⏳ Waiting");
    }

    const units = creep.pos
      .findInRange(FIND_MY_CREEPS, 1)
      .filter((unit) => unit.store.getFreeCapacity() > 0);

    if (units.length > 0) {
      const unit = units[0];
      const transferResult = creep.transfer(unit, RESOURCE_ENERGY);
      if (transferResult === OK && Game.time % 5 === 0) {
        creep.say("🔄 Transferring");
      }
    }
  }

  if (creep.store.getFreeCapacity() === 0 && Game.time % 5 === 0) {
    creep.say("🛑 Energy Full");
    return;
  }

  if (creep.memory.task === "harvesting") {
    creep.moveTo(targetResource, {
      visualizePathStyle: { stroke: "#ffaa00" },
      reusePath: 5,
    });
    if (creep.pos.isNearTo(targetResource)) {
      creep.memory.task = "mining";
    }
    return;
  }
};

const create: BaseRole["create"] = (baseId?: string, spawnCreepParams = {}) => {
  return baseRole.create({
    baseId,
    body: [WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, MOVE],
    role: "miner",
    opts: { memory: { task: "harvesting" } },
    ...spawnCreepParams,
  });
};

export default {
  run,
  create,
};
