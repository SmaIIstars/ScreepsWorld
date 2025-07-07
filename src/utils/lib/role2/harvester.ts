import { BASE_ID_ENUM } from '@/constant';
import EMOJI from '@/constant/emoji';
import { intervalSleep } from '@/utils';
import { merge } from 'lodash';
import { BaseRole, BaseRoleCreateParams } from '../base/BaseRole';

const CustomEnergyStoreStructureType: Array<Structure['structureType']> = [
  STRUCTURE_EXTENSION,
  STRUCTURE_SPAWN,
  STRUCTURE_CONTAINER,
  STRUCTURE_STORAGE,
];

export class Harvester extends BaseRole {
  task: Extract<CustomTaskType, 'harvesting' | 'transferring'> = 'harvesting';

  constructor() {
    super('harvester');
  }

  create = (params: BaseRoleCreateParams) => {
    const { baseId = BASE_ID_ENUM.MainBase, body, name, memoryRoleOpts } = params;
    const curName = name ?? `${this.role}-${Game.time}`;
    return Game.spawns?.[baseId]?.spawnCreep(
      body,
      curName,
      merge({ memory: { role: this.role, task: this.task } }, memoryRoleOpts),
    );
  };

  run(creep: Creep): void {
    // 1. 如果身上没有能量，且正在执行存储任务，则切换到采集任务
    if (creep.store[RESOURCE_ENERGY] === 0 && creep.memory.task === 'transferring') {
      creep.memory.task = 'harvesting';
    }

    // 2. 如果身上能量满了，且正在执行采集任务，则切换到存储任务
    if (creep.store.getFreeCapacity() === 0 && creep.memory.task === 'harvesting') {
      creep.memory.task = 'transferring';
      this.roleTask(creep);
    }
  }

  // 存储任务
  roleTask(creep: Creep): void {
    // 1. 找到房间内还可以存储能量的单位并进行优先级排序
    const targetUnits = creep.room
      .find(FIND_MY_STRUCTURES, {
        filter: (structure) =>
          CustomEnergyStoreStructureType.includes(structure.structureType) &&
          'store' in structure &&
          structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0,
      })
      .sort((a, b) => {
        const aIndex = CustomEnergyStoreStructureType.indexOf(a.structureType);
        const bIndex = CustomEnergyStoreStructureType.indexOf(b.structureType);
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

  // 从Source获取能量
  getEnergyFromSource(): void {
    // 从Memory中获取source
  }
}
