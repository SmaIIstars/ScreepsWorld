import EMOJI from '@/constant/emoji';
import { intervalSleep } from '@/utils';
import { AvailableSourceType } from '@/utils/monitor/memory';
import { queryAvailableGetSourcePositions } from '@/utils/query';
import { baseRole } from '../base/role';

type HarvesterOptions = {
  priority?: 'high' | 'low';
};

const CustomEnergyStructureType: Array<Structure['structureType']> = [
  STRUCTURE_EXTENSION,
  STRUCTURE_SPAWN,
  STRUCTURE_CONTAINER,
  STRUCTURE_STORAGE,
];

const run: BaseRole<HarvesterOptions>['run'] = (creep: Creep, opts?: HarvesterOptions) => {
  // 1. 执行存储任务
  if (creep.memory.task === 'transferring') {
    if (creep.store[RESOURCE_ENERGY] === 0) {
      creep.memory.task = 'harvesting';
      return;
    }

    const targets = creep.room
      .find(FIND_STRUCTURES, {
        filter: (
          structure,
        ): structure is StructureExtension | StructureSpawn | StructureTower | StructureStorage | StructureContainer =>
          CustomEnergyStructureType.includes(structure.structureType) &&
          'store' in structure &&
          structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0,
      })
      .sort((a, b) => {
        const aIndex = CustomEnergyStructureType.indexOf(a.structureType);
        const bIndex = CustomEnergyStructureType.indexOf(b.structureType);
        return aIndex - bIndex;
      });

    if (targets.length > 0) {
      if (creep.transfer(targets[0], RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
        creep.moveTo(targets[0], {
          visualizePathStyle: { stroke: '#ffffff' },
        });
      }
    }
    return;
  }

  // 3. 如果creep的能量满了，则切换到各自任务
  if (creep.store.getFreeCapacity() === 0) {
    if (creep.memory.role === 'harvester') {
      creep.memory.task = 'transferring';
    }
    return;
  }

  // 5. 如果creep的能量空了 且正在执行角色任务，则切换到采集任务
  if (creep.store[RESOURCE_ENERGY] === 0 && creep.memory.task !== 'harvesting') {
    creep.memory.task = 'harvesting';
    return;
  }

  // 2. 执行采集任务
  // 1. creep能量没满且正在执行采集任务则继续执行
  if (creep.store.getFreeCapacity() > 0 && creep.memory.task === 'harvesting') {
    // 非采集role优先Container中的的资源去做role任务
    if (creep.memory.role !== 'harvester') {
      const targetSource: StructureContainer[] = creep.room.find(FIND_STRUCTURES, {
        filter: (structure) =>
          structure.structureType === STRUCTURE_CONTAINER &&
          structure.store[RESOURCE_ENERGY] > creep.store.getFreeCapacity(),
      });

      if (targetSource.length > 0) {
        if (creep.pos.isNearTo(targetSource[0])) {
          const pickupResult = creep.withdraw(targetSource[0], RESOURCE_ENERGY);
          if (pickupResult === OK) creep.say(EMOJI.receiving);
          return;
        } else {
          creep.moveTo(targetSource[0], {
            visualizePathStyle: { stroke: '#ffaa00' },
          });
          return;
        }
      }
    }

    // 获取采集资源列表
    const allAvailableSources: Array<AvailableSourceType> = Object.values(Memory.sources.Source).map(
      (id) => Game.getObjectById(id) as Source,
    );
    const availabilitySourcesMap = allAvailableSources.reduce<{
      Source: Array<Source>;
      Resource: Array<Resource<ResourceConstant>>;
      Tombstone: Array<Tombstone>;
      Ruin: Array<Ruin>;
    }>(
      (acc, source) => {
        if (source instanceof Source && source.energy > 0) {
          acc['Source'] = [...(acc['Source'] ?? []), source];
        } else if (source instanceof Resource && source.amount > 0) {
          acc['Resource'] = [...(acc['Resource'] ?? []), source];
        } else if (source instanceof Tombstone && source.store[RESOURCE_ENERGY] > 0) {
          acc['Tombstone'] = [...(acc['Tombstone'] ?? []), source];
        } else if (source instanceof Ruin && source.store[RESOURCE_ENERGY] > 0) {
          acc['Ruin'] = [...(acc['Ruin'] ?? []), source];
        }
        return acc;
      },
      { Source: [], Resource: [], Tombstone: [], Ruin: [] },
    );

    // 先捡地上的资源
    if (availabilitySourcesMap['Resource'].length > 0) {
      const targetSource = availabilitySourcesMap['Resource'][0];
      const pickupResult = creep.pickup(targetSource);

      if (pickupResult === OK) {
        creep.say(EMOJI.harvesting);
      } else if (pickupResult === ERR_NOT_IN_RANGE) {
        creep.moveTo(targetSource, {
          visualizePathStyle: { stroke: '#ffaa00' },
        });
      }
      return;
    }

    // Tombstone和Ruin的资源让非Harvester角色去采集
    if (
      creep.memory.role !== 'harvester' &&
      (availabilitySourcesMap['Tombstone'].length > 0 || availabilitySourcesMap['Ruin'].length > 0)
    ) {
      const targetSource = availabilitySourcesMap['Tombstone'][0] ?? availabilitySourcesMap['Ruin'][0];
      const pickupResult = creep.withdraw(targetSource, RESOURCE_ENERGY);

      if (pickupResult === OK) {
        creep.say(EMOJI.harvesting);
      } else if (pickupResult === ERR_NOT_IN_RANGE) {
        creep.moveTo(targetSource, {
          visualizePathStyle: { stroke: '#ffaa00' },
        });
      }
      return;
    }

    // 非Harvester角色 or 高优先级Harvester, 去最近的有能源的Miner或者MinerStore采集
    if (creep.memory.role !== 'harvester' || (creep.memory.role === 'harvester' && opts?.priority === 'high')) {
      const targetMiner = creep.pos.findClosestByPath(FIND_MY_CREEPS, {
        filter: (curCreep) => {
          if (
            (curCreep.memory.role === 'miner' || curCreep.memory.role === 'minerStore') &&
            curCreep.store[RESOURCE_ENERGY] > 0
          ) {
            // 在这里控制拥塞, 如果当前Miner或者MinerStore周围空位达到阈值, 则不去这里采集
            const availablePositions = queryAvailableGetSourcePositions(curCreep.pos.x, curCreep.pos.y);
            return availablePositions?.length > 1;
          }

          return false;
        },
      });

      if (targetMiner && !creep.pos.isNearTo(targetMiner)) {
        creep.moveTo(targetMiner);
        return;
      }
    }

    // 兜底方案, 自己挖矿
    const { priority = 'low' } = opts ?? {};
    const exploitableSources = availabilitySourcesMap['Source'];
    if (exploitableSources.length === 0) return;
    // 根据角色优先级去不同的资源进行采集
    const targetResource =
      priority === 'high' ? exploitableSources[0] : exploitableSources[exploitableSources.length - 1];
    creep.memory.targetSourceId = targetResource.id;
    // 在资源范围内采集资源
    const harvestResult = creep.harvest(targetResource);
    if (harvestResult === OK) {
      intervalSleep(10, () => creep.say(EMOJI.harvesting));
    } else if (harvestResult === ERR_NOT_IN_RANGE) {
      creep.moveTo(targetResource, {
        visualizePathStyle: { stroke: '#ffaa00' },
      });
    }
    return;
  }
};

const create: BaseRole['create'] = (baseId?: string, spawnCreepParams = {}) => {
  return baseRole.create({
    baseId,
    body: [WORK, WORK, CARRY, MOVE],
    role: 'harvester',
    opts: { memory: { task: 'harvesting' } },
    ...spawnCreepParams,
  });
};

export default {
  run,
  create,
};
