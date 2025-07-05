import { baseRole } from "../base/role";

const run: BaseRole["run"] = (creep: Creep) => {
  if (creep.store.getFreeCapacity() === 0) {
    creep.say("🛑 满了");
    return;
  }

  const availableResources = Object.values(Memory.resources)
    .filter(
      (resource) =>
        resource.creepsNearSource.length < resource.availablePositions.length
    )
    .map((resource) => resource.source)
    .filter((source) => source.energy > 0 || source.ticksToRegeneration < 300);

  const targetResource = availableResources.pop();
  if (!targetResource) return;
  creep.memory.targetSourceId = targetResource.id;

  if (!creep.pos.isNearTo(targetResource)) {
    creep.moveTo(targetResource, {
      visualizePathStyle: { stroke: "#ffaa00" },
      reusePath: 5,
    });
    return;
  }

  const harvestResult = creep.harvest(targetResource);
  if (harvestResult === OK) {
    creep.say("⛏️ 挖矿");
  } else if (harvestResult === ERR_NOT_ENOUGH_RESOURCES) {
    creep.say("⏳ 等待");
  }
};

const create: BaseRole["create"] = (baseId?: string, spawnCreepParams = {}) => {
  return baseRole.create({
    baseId,
    body: [WORK, WORK, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE],
    role: "miner",
    ...spawnCreepParams,
  });
};

export default {
  run,
  create,
};
