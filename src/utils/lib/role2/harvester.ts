import { BASE_ID_ENUM } from '@/constant';
import { EnergyStoreType } from '@/utils/query';
import { BaseRole, BaseRoleCreateParams } from '../base/BaseRole';

const PriorityQueueOfStoreEnergy: Array<Structure['structureType']> = [
  STRUCTURE_EXTENSION,
  STRUCTURE_SPAWN,
  STRUCTURE_STORAGE,
  STRUCTURE_CONTAINER,
];

class Harvester extends BaseRole {
  static readonly role: Extract<CustomRoleType, 'harvester'> = 'harvester';

  constructor() {
    super(Harvester.role);
  }

  create = (params: BaseRoleCreateParams) => {
    const {
      baseId = BASE_ID_ENUM.MainBase,
      body,
      name,
      memoryRoleOpts = { role: 'harvester', task: 'harvesting' },
    } = params;
    const curName = name ?? `${this.role}-${Game.time}`;
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
    } else {
      this.roleTask(creep);
    }
  }

  // 存储任务
  roleTask(creep: Creep, room = creep.room): void {
    // 1. 找到房间内还可以存储能量的单位并进行优先级排序
    const targetUnits = room
      .find(FIND_MY_STRUCTURES, {
        filter: (structure) =>
          PriorityQueueOfStoreEnergy.includes(structure.structureType) &&
          'store' in structure &&
          structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0,
      })
      .sort((a, b) => {
        // 同类型的近的优先
        if (a.structureType === b.structureType) {
          return a.pos.getRangeTo(creep.pos) - b.pos.getRangeTo(creep.pos);
        }
        const aIndex = PriorityQueueOfStoreEnergy.indexOf(a.structureType);
        const bIndex = PriorityQueueOfStoreEnergy.indexOf(b.structureType);
        return aIndex - bIndex;
      });

    if (targetUnits.length > 0) {
      const storeResources: Array<ResourceConstant> = [];
      for (const [resourceType, amount] of Object.entries(creep.store)) {
        if (amount > 0) {
          storeResources.push(resourceType as ResourceConstant);
        }
      }

      for (const resourceType of storeResources) {
        const transferResult = creep.transfer(targetUnits[0], resourceType);
        switch (transferResult) {
          case ERR_NOT_IN_RANGE: {
            creep.moveTo(targetUnits[0], { visualizePathStyle: { stroke: '#ffffff' } });
            break;
          }
        }
      }

      // const transferResult = creep.transfer(targetUnits[0], RESOURCE_ENERGY);
      // switch (transferResult) {
      //   case ERR_NOT_IN_RANGE: {
      //     creep.moveTo(targetUnits[0], { visualizePathStyle: { stroke: '#ffffff' } });
      //     break;
      //   }
      //   default:
      //     intervalSleep(10, () => creep.say(EMOJI.transferring), { time: creep.ticksToLive });
      // }
    }
  }

  // Harvester 专属采集任务，只专注于采集能源点，矿车和矿车仓库
  harvestTask(creep: Creep): void {
    // 有WORK组件的，才可以采集能源点
    const targetTypes: EnergyStoreType[] = ['resource', 'ruin', 'tombstone', 'container', 'miner'];
    if (creep.body.some((part) => part.type === WORK)) targetTypes.push('source');

    this.getEnergyFromStore(creep, targetTypes);
  }
}

export default new Harvester();
