import { BASE_ID_ENUM } from '@/constant';
import EMOJI from '@/constant/emoji';
import { intervalSleep } from '@/utils';
import { EnergyStoreTargetType, EnergyStoreType, findAvailableTargetByRange } from '@/utils/query';
import { BaseRole, BaseRoleCreateParams } from '../base/BaseRole';

const PriorityQueueOfStoreEnergy: Array<Structure['structureType']> = [
  STRUCTURE_EXTENSION,
  STRUCTURE_SPAWN,
  STRUCTURE_CONTAINER,
  STRUCTURE_STORAGE,
];

class Harvester extends BaseRole {
  task: Extract<CustomRoleTaskType, 'harvesting' | 'transferring'> = 'harvesting';

  constructor() {
    super('harvester');
  }

  create = (params: BaseRoleCreateParams) => {
    const { baseId = BASE_ID_ENUM.MainBase, body, name, memoryRoleOpts } = params;
    const curName = `${name}-${Game.time}`;
    return Game.spawns[baseId].spawnCreep(body, curName, { memory: memoryRoleOpts });
  };

  run(creep: Creep): void {
    // 1. 如果身上没有能量，且正在执行存储任务，则切换到采集任务
    if (creep.store[RESOURCE_ENERGY] === 0 && creep.memory.task === 'transferring') {
      creep.memory.task = 'harvesting';
    }

    // 2. 如果身上能量满了，且正在执行采集任务，则切换到存储任务
    if (creep.store.getFreeCapacity() === 0 && creep.memory.task === 'harvesting') {
      creep.memory.task = 'transferring';
    }

    if (creep.memory.task === 'harvesting') {
      this.harvestTask(creep);
      return;
    }

    if (creep.memory.task === 'transferring') {
      this.roleTask(creep);
      return;
    }
  }

  // 存储任务
  roleTask(creep: Creep): void {
    // 1. 找到房间内还可以存储能量的单位并进行优先级排序
    const targetUnits = creep.room
      .find(FIND_MY_STRUCTURES, {
        filter: (structure) =>
          PriorityQueueOfStoreEnergy.includes(structure.structureType) &&
          'store' in structure &&
          structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0,
      })
      .sort((a, b) => {
        const aIndex = PriorityQueueOfStoreEnergy.indexOf(a.structureType);
        const bIndex = PriorityQueueOfStoreEnergy.indexOf(b.structureType);
        return aIndex - bIndex;
      });

    if (targetUnits.length > 0) {
      // TODO: 可以找最近的或者进行分工
      const transferResult = creep.transfer(targetUnits[0], RESOURCE_ENERGY);
      switch (transferResult) {
        case ERR_NOT_IN_RANGE: {
          creep.moveTo(targetUnits[0], { visualizePathStyle: { stroke: '#ffffff' } });
          break;
        }
        default:
          intervalSleep(10, () => creep.say(EMOJI.transferring), { time: creep.ticksToLive });
      }
    }
  }

  // Harvester 专属采集任务，只专注于采集能源点，矿车和矿车仓库
  harvestTask(creep: Creep): void {
    // 从最近且有能量的矿车仓库(MinerStore是一个Creep)获取能量
    const targetMinerStore = creep.pos.findClosestByRange(FIND_MY_CREEPS, {
      filter: (creep) => creep.memory.role === 'minerStore' && creep.store[RESOURCE_ENERGY] > 0,
    });

    if (targetMinerStore) {
      const transferResult = creep.transfer(targetMinerStore, RESOURCE_ENERGY);
      if (transferResult === OK) {
        intervalSleep(10, () => creep.say(EMOJI.transferring), { time: creep.ticksToLive });
      }
    }

    // 从矿车获取能量
    this.getEnergyFromStore(creep, ['MinerStore', 'deposit', 'mineral', 'source']);

    // 从能源点获取能量
    // this.getEnergyFromStore(creep, ['deposit', 'mineral', 'source']);
  }

  /**
   * 从有能量的存储单位获取能量
   * @param creep
   * @param targetStoreType 有能量的存储单位类型
   */
  getEnergyFromStore(creep: Creep, targetStoreTypes: EnergyStoreType[]): void {
    let targetStore: EnergyStoreTargetType = null;

    // 1. 单类型
    if (targetStoreTypes.length === 1) {
      const [targetStoreType] = targetStoreTypes;
      if (targetStoreType) {
        targetStore = findAvailableTargetByRange(creep, targetStoreType, true);
      }
    } else {
      // 2. 多类型
      const allTargets: NonNullable<EnergyStoreTargetType>[] = [];
      for (const targetStoreType of targetStoreTypes) {
        const targets = findAvailableTargetByRange(creep, targetStoreType, false)?.filter((target) => target !== null);
        // es版本的兼容问题
        if (targets) {
          for (const target of targets) {
            if (target) allTargets.push(target);
          }
        }
      }

      let minDist = Infinity;
      for (const target of allTargets) {
        const dist = creep.pos.getRangeTo(target);
        if (dist < minDist) {
          minDist = dist;
          targetStore = target;
        }
      }
    }

    // 如果找到最近的
    if (targetStore) {
      // 不在附近则移动过去
      if (!targetStore.pos.isNearTo(creep.pos)) {
        creep.moveTo(targetStore, { visualizePathStyle: { stroke: '#ffffff' } });
        return;
      }

      // 在旁边的根据目标类型进行不同的操作
      //   harvest: ['deposit', 'mineral', 'source'],
      //   transfer: ['MinerStore'],
      //   withdraw: ['ruin', 'tombstone', 'container', 'storage'],
      //   pick: ['resource'],
      if (targetStore instanceof Creep) {
        // 非主动, 等待对方transfer,
        return;
      }
      if (targetStore instanceof Source || targetStore instanceof Mineral) {
        creep.harvest(targetStore);
        intervalSleep(10, () => creep.say(EMOJI.harvesting), { time: creep.ticksToLive });
        return;
      }
      if (targetStore instanceof Ruin || targetStore instanceof Tombstone) {
        creep.withdraw(targetStore, RESOURCE_ENERGY);
        intervalSleep(10, () => creep.say(EMOJI.withdrawing), { time: creep.ticksToLive });
        return;
      }

      if (targetStore instanceof StructureStorage || targetStore instanceof StructureContainer) {
        creep.withdraw(targetStore, RESOURCE_ENERGY);
        intervalSleep(10, () => creep.say(EMOJI.withdrawing), { time: creep.ticksToLive });
        return;
      }

      if (targetStore instanceof Resource) {
        creep.pickup(targetStore);
        intervalSleep(10, () => creep.say(EMOJI.picking), { time: creep.ticksToLive });
        return;
      }
    }
  }
}

export default new Harvester();
