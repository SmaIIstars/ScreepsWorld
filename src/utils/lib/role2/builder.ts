import { BASE_ID_ENUM } from '@/constant';
import EMOJI from '@/constant/emoji';
import { intervalSleep } from '@/utils';
import { BaseRole, BaseRoleCreateParams } from '../base/BaseRole';

import Repairer from './repairer';

const PriorityQueueOfBuilding: BuildableStructureConstant[] = [
  STRUCTURE_EXTENSION,
  STRUCTURE_TOWER,
  STRUCTURE_WALL,
  STRUCTURE_RAMPART,
  STRUCTURE_ROAD,
  STRUCTURE_CONTAINER,
];

class Builder extends BaseRole {
  static readonly role: Extract<CustomRoleType, 'builder'> = 'builder';

  constructor() {
    super(Builder.role);
  }

  create(params: BaseRoleCreateParams): ScreepsReturnCode {
    const {
      baseId = BASE_ID_ENUM.MainBase,
      body,
      name,
      memoryRoleOpts = { role: 'builder', task: 'harvesting' },
    } = params;
    const curName = name ?? `${this.role}-${Game.time}`;
    return Game.spawns[baseId].spawnCreep(body, curName, { memory: memoryRoleOpts });
  }

  run(creep: Creep): void {
    // 1. 如果身上没有能量，且正在执行修建或者维修任务，则切换到采集任务
    if (creep.store[RESOURCE_ENERGY] === 0 && creep.memory.task !== 'harvesting') {
      creep.memory.task = 'harvesting';
    }

    // 2. 如果身上能量满了，且正在执行采集任务，则切换到修建任务
    if (creep.store.getFreeCapacity() === 0 && creep.memory.task === 'harvesting') {
      creep.memory.task = 'building';
    }

    if (creep.memory.task === 'harvesting') {
      this.getEnergyFromStore(creep, ['resource', 'ruin', 'tombstone', 'storage', 'miner', 'source']);
    } else {
      this.roleTask(creep);
    }
  }

  // 建筑任务
  roleTask(creep: Creep): void {
    const targetConstructionSites = creep.room.find(FIND_MY_CONSTRUCTION_SITES).sort((a, b) => {
      const aIndex = PriorityQueueOfBuilding.indexOf(a.structureType);
      const bIndex = PriorityQueueOfBuilding.indexOf(b.structureType);
      return aIndex - bIndex;
    });

    // 如果未完成的建筑, 优先修
    if (targetConstructionSites.length > 0) {
      // 如果正在维修但有新建筑, 则切换到建筑任务
      if (creep.memory.task === 'repairing') creep.memory.task = 'building';

      const buildResult = creep.build(targetConstructionSites[0]);
      switch (buildResult) {
        case ERR_NOT_IN_RANGE: {
          creep.moveTo(targetConstructionSites[0], { visualizePathStyle: { stroke: '#ffffff' } });
          break;
        }
        default: {
          intervalSleep(10, () => creep.say(EMOJI.building), { time: creep.ticksToLive });
          break;
        }
      }
    } else {
      // 如果没有需要修的建筑, 则去维修
      creep.memory.task = 'repairing';
      this.roleTask2(creep);
    }
  }

  // 维修任务
  roleTask2(creep: Creep): void {
    Repairer.run(creep);
  }
}

export default new Builder();
