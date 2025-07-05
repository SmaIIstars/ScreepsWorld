import { AvailableSourceType } from "@/utils/monitor/resource";
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
    const allAvailableSources: Array<AvailableSourceType> = Object.values(
      Memory.resources
    ).map((resource) => resource.source);
    const availabilitySourcesMap = allAvailableSources.reduce<{
      Source: Array<Source>;
      Resource: Array<Resource<ResourceConstant>>;
      Tombstone: Array<Tombstone>;
      Ruin: Array<Ruin>;
    }>(
      (acc, source) => {
        if (source instanceof Source && source.energy > 0) {
          acc["Source"] = [...(acc["Source"] ?? []), source];
        } else if (source instanceof Resource && source.amount > 0) {
          acc["Resource"] = [...(acc["Resource"] ?? []), source];
        } else if (
          source instanceof Tombstone &&
          source.store[RESOURCE_ENERGY] > 0
        ) {
          acc["Tombstone"] = [...(acc["Tombstone"] ?? []), source];
        } else if (
          source instanceof Ruin &&
          source.store[RESOURCE_ENERGY] > 0
        ) {
          acc["Ruin"] = [...(acc["Ruin"] ?? []), source];
        }
        return acc;
      },
      { Source: [], Resource: [], Tombstone: [], Ruin: [] }
    );

    // 先捡地上的资源
    if (availabilitySourcesMap["Resource"].length > 0) {
      const targetSource = availabilitySourcesMap["Resource"][0];
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

    // 非采集role捡建筑中的的资源去做role任务
    if (
      creep.memory.role !== "harvester" &&
      (availabilitySourcesMap["Tombstone"].length > 0 ||
        availabilitySourcesMap["Ruin"].length > 0)
    ) {
      const targetSource =
        availabilitySourcesMap["Tombstone"][0] ??
        availabilitySourcesMap["Ruin"][0];
      const pickupResult = creep.withdraw(targetSource, RESOURCE_ENERGY);

      if (pickupResult === OK) {
        creep.say("📦 Withdraw");
      } else if (pickupResult === ERR_NOT_IN_RANGE) {
        creep.moveTo(targetSource, {
          visualizePathStyle: { stroke: "#ffaa00" },
        });
      }
      return;
    }

    // 捡可采集的资源
    const { priority = "low" } = opts ?? {};
    const exploitableSources = availabilitySourcesMap["Source"];
    if (exploitableSources.length === 0) return;

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
    body: [WORK, WORK, CARRY, MOVE],
    role: "harvester",
    opts: { memory: { task: "harvesting" } },
    ...spawnCreepParams,
  });
};

export default {
  run,
  create,
};
