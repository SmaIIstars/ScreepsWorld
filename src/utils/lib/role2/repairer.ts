import { BASE_ID_ENUM } from '@/constant';
import EMOJI from '@/constant/emoji';
import { intervalSleep } from '@/utils';
import { BaseRole, BaseRoleCreateParams } from '../base/BaseRole';

const RepairerPriorityQueueOfNeedRepair: BuildableStructureConstant[] = [
  STRUCTURE_TOWER,
  STRUCTURE_RAMPART,
  STRUCTURE_WALL,
  STRUCTURE_ROAD,
];

class Repairer extends BaseRole {
  static readonly role: Extract<CustomRoleType, 'repairer'> = 'repairer';

  constructor() {
    super(Repairer.role);
  }

  create(params: BaseRoleCreateParams): ScreepsReturnCode {
    const {
      baseId = BASE_ID_ENUM.MainBase,
      body,
      name,
      memoryRoleOpts = { role: this.role, task: 'harvesting' },
    } = params;
    const curName = name ?? `${this.role}-${Game.time}`;
    return Game.spawns[baseId].spawnCreep(body, curName, { memory: memoryRoleOpts });
  }

  run(creep: Creep): void {
    // 1. 如果身上没有能量，且正在执行维修任务，则切换到采集任务
    if (creep.store[RESOURCE_ENERGY] === 0 && creep.memory.task !== 'harvesting') {
      creep.memory.task = 'harvesting';
    }

    // 2. 如果身上能量满了，且正在执行采集任务，则切换到维修任务
    if (creep.store.getFreeCapacity() === 0 && creep.memory.task === 'harvesting') {
      creep.memory.task = 'repairing';
    }

    if (creep.memory.task === 'harvesting') {
      this.getEnergyFromStore(creep, ['storage', 'resource', 'ruin', 'tombstone', 'container', 'miner', 'source']);
    } else {
      this.roleTask(creep);
    }
  }

  // 升级任务
  roleTask(creep: Creep): void {
    // 1. 获取维修目标
    const targetStructures = creep.room
      .find(FIND_STRUCTURES, {
        filter: (s) => {
          if (s.hits < s.hitsMax) return true;
          if (s instanceof StructureTower && s.store.getFreeCapacity(RESOURCE_ENERGY) > 0) return true;
          return false;
        },
      })
      .sort((a, b) => {
        // 按照优先级队列RepairerPriorityQueueOfStoreEnergy排序
        const aIndex = RepairerPriorityQueueOfNeedRepair.indexOf(a.structureType as BuildableStructureConstant);
        const bIndex = RepairerPriorityQueueOfNeedRepair.indexOf(b.structureType as BuildableStructureConstant);
        if (aIndex !== bIndex) {
          return aIndex - bIndex;
        }
        // 同类型按血量升序
        return a.hits - b.hits;
      });

    console.log('builder roleTask2');
    console.log(targetStructures);

    if (!targetStructures.length) return;
    const targetStructure = targetStructures[0];
    if (!targetStructure.pos.isNearTo(creep)) {
      creep.moveTo(targetStructure, { visualizePathStyle: { stroke: '#ffffff' } });
    } else {
      // 先填炮塔
      if (
        targetStructure.structureType === STRUCTURE_TOWER &&
        targetStructure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
      ) {
        const transferResult = creep.transfer(targetStructure, RESOURCE_ENERGY);
        if (transferResult === OK) intervalSleep(5, () => creep.say(EMOJI.transferring));
      } else {
        // 再修建筑
        const repairResult = creep.repair(targetStructure);
        switch (repairResult) {
          case ERR_NOT_IN_RANGE: {
            creep.moveTo(targetStructure, { visualizePathStyle: { stroke: '#ffffff' } });
            break;
          }
        }
      }
    }
  }
}

export default new Repairer();
