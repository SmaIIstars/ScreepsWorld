import { BASE_ID_ENUM } from "@/constant";
import { baseRole } from "../base/role";

type HarvesterOptions = {
  priority?: "high" | "low";
};

const CustomEnergyStructureType: Array<Structure["structureType"]> = [
  STRUCTURE_EXTENSION,
  STRUCTURE_SPAWN,
  STRUCTURE_TOWER,
  STRUCTURE_STORAGE,
  STRUCTURE_CONTAINER,
];

const run: BaseRole<HarvesterOptions>["run"] = (
  creep: Creep,
  opts?: HarvesterOptions
) => {
  // 1. 执行存储任务
  if (creep.memory.task === "transferring") {
    if (creep.store[RESOURCE_ENERGY] === 0) {
      creep.memory.task = "harvesting";
      return;
    }

    const targets = creep.room.find(FIND_STRUCTURES, {
      filter: (
        structure
      ): structure is
        | StructureExtension
        | StructureSpawn
        | StructureTower
        | StructureStorage
        | StructureContainer =>
        CustomEnergyStructureType.includes(structure.structureType) &&
        "store" in structure &&
        structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0,
    });

    if (targets.length > 0) {
      if (creep.transfer(targets[0], RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
        creep.moveTo(targets[0], {
          visualizePathStyle: { stroke: "#ffffff" },
        });
      }
    }
    return;
  }

  // 2. 执行采集任务
  // 1. creep能量没满且正在执行采集任务则继续执行
  if (creep.store.getFreeCapacity() > 0 && creep.memory.task === "harvesting") {
    // 获取采集资源列表
    const sourcesDropped = Game.spawns[BASE_ID_ENUM.MainBase].room.find(
      FIND_DROPPED_RESOURCES
    );
    // 先捡地上的资源
    if (sourcesDropped.length > 0) {
      const targetSource = sourcesDropped[0];
      const pickupResult = creep.pickup(targetSource);

      if (pickupResult === OK) {
        creep.say("📦 Pickup");
      } else if (pickupResult === ERR_NOT_IN_RANGE) {
        creep.moveTo(targetSource, {
          visualizePathStyle: { stroke: "#ffaa00" },
        });
      }
      return;
    }

    // 捡可采集的资源
    const { priority = "low" } = opts ?? {};
    const exploitableSources = Object.values(Memory.resources)
      .filter((resource) => resource.source.energy > 0)
      .map((resource) => resource.source);
    if (exploitableSources.length === 0) {
      creep.memory.task = "idle";
      return;
    }

    // 根据角色优先级去不同的资源进行采集
    const targetResource =
      priority === "high"
        ? exploitableSources[0]
        : exploitableSources[exploitableSources.length - 1];
    creep.memory.targetSourceId = targetResource.id;
    // 在资源范围内采集资源
    if (creep.harvest(targetResource) === ERR_NOT_IN_RANGE) {
      creep.moveTo(targetResource, {
        visualizePathStyle: { stroke: "#ffaa00" },
      });
    }
    return;
  }

  // 3. 如果creep的能量满了且正在执行采集任务，则切换到各自任务
  if (
    creep.store.getFreeCapacity() === 0 &&
    creep.memory.task === "harvesting"
  ) {
    if (creep.memory.role === "harvester") {
      creep.memory.task = "transferring";
    }
    return;
  }

  // 5. 如果creep的能量空了 且正在执行角色任务，则切换到采集任务
  if (
    creep.store[RESOURCE_ENERGY] === 0 &&
    creep.memory.task !== "harvesting"
  ) {
    creep.memory.task = "harvesting";
    return;
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
