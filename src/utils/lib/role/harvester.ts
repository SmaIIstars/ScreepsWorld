import { baseRole } from "../base/role";

type HarvesterOptions = {
  priority?: "high" | "low";
};

const run: BaseRole<HarvesterOptions>["run"] = (
  creep: Creep,
  opts?: HarvesterOptions
) => {
  const { priority = "low" } = opts ?? {};
  const exploitableResources = Object.values(Memory.resources).filter(
    (resource) => resource.source.energy > 0
  );
  if (exploitableResources.length === 0) {
    creep.memory.task = "idle";
    return;
  }

  if (creep.store.getFreeCapacity() > 0) {
    const resources = Object.values(Memory.resources)
      // .filter((resource) =>
      //   resource.availablePositions.length - resource.creepsNearSource.length >
      //     0
      // )
      .map((resource) => resource.source);

    const targetResource =
      priority === "high" ? resources[0] : resources[resources.length - 1];

    if (targetResource && creep.harvest(targetResource) == ERR_NOT_IN_RANGE) {
      creep.memory.targetSourceId = targetResource.id;
      creep.moveTo(targetResource, {
        visualizePathStyle: { stroke: "#ffaa00" },
      });
    }
    return;
  }
  if (creep.store.getFreeCapacity() == 0 && creep.memory.role === "harvester") {
    const targets = creep.room.find(FIND_STRUCTURES, {
      filter: (structure) => {
        return (
          (structure.structureType == STRUCTURE_EXTENSION ||
            structure.structureType == STRUCTURE_SPAWN ||
            structure.structureType == STRUCTURE_TOWER) &&
          structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
        );
      },
    });

    if (targets.length > 0) {
      if (creep.transfer(targets[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
        creep.moveTo(targets[0], {
          visualizePathStyle: { stroke: "#ffffff" },
        });
      }
    }
  }
};

const create: BaseRole["create"] = (baseId?: string, spawnCreepParams = {}) => {
  return baseRole.create({
    baseId,
    body: [WORK, WORK, CARRY, CARRY, MOVE, MOVE],
    role: "harvester",
    opts: { memory: { task: "harvesting" } },
    ...spawnCreepParams,
  });
};

export default {
  run,
  create,
};
