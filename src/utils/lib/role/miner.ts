import { baseRole } from "../base/role";

const run: BaseRole["run"] = (creep: Creep) => {
  if (creep.memory.task === "mining") {
    const units = creep.room
      .find(FIND_MY_CREEPS)
      .filter(
        (c) => c.store.getFreeCapacity() > 0 && c.memory.role !== "miner"
      );

    if (units.length > 0) {
      const unit = units[0];
      const transferResult = creep.transfer(unit, RESOURCE_ENERGY);
      if (transferResult === OK && Game.time % 10 === 0) {
        creep.say("🔄 Transfer");
      }
    }
  }

  let targetResource: Source | null = null;
  if (!creep.memory.targetSourceId) {
    const availableResources = Object.values(Memory.resources)
      .filter(
        (resource) =>
          resource.creepsNearSource.length < resource.availablePositions.length
      )
      .map((resource) => resource.source)
      .filter(
        (source) => source.energy > 0 || source.ticksToRegeneration < 300
      );
    targetResource = availableResources.pop() ?? null;
    creep.memory.targetSourceId = targetResource?.id;
  } else {
    targetResource =
      Memory.resources[creep.memory.targetSourceId]?.source ?? null;
  }
  if (!targetResource) return;

  if (creep.memory.task === "mining") {
    const harvestResult = creep.harvest(targetResource);
    if (harvestResult === OK) {
      creep.say("⛏️ Mining");
    } else if (harvestResult === ERR_NOT_ENOUGH_RESOURCES) {
      creep.say("⏳ Waiting");
    }
  }

  if (creep.store.getFreeCapacity() === 0 && Game.time % 10 === 0) {
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
    ...spawnCreepParams,
  });
};

export default {
  run,
  create,
};
