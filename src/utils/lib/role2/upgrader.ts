import { BASE_ID_ENUM } from '@/constant';
import EMOJI from '@/constant/emoji';
import { intervalSleep } from '@/utils';
import { BaseRole, BaseRoleCreateParams } from '../base/BaseRole';

class Upgrader extends BaseRole {
  static readonly role: Extract<CustomRoleType, 'upgrader'> = 'upgrader';

  constructor() {
    super(Upgrader.role);
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
    // 1. 如果身上没有能量，且正在执行升级任务，则切换到采集任务
    if (creep.store[RESOURCE_ENERGY] === 0 && creep.memory.task !== 'harvesting') {
      creep.memory.task = 'harvesting';
    }

    // 2. 如果身上能量满了，且正在执行采集任务，则切换到升级任务
    if (creep.store.getFreeCapacity() === 0 && creep.memory.task === 'harvesting') {
      creep.memory.task = 'upgrading';
    }

    if (creep.memory.task === 'harvesting') {
      this.getEnergyFromStore(creep, [
        'resource',
        'ruin',
        'tombstone',
        'link',
        'terminal',
        'storage',
        'container',
        'miner',
        'source',
      ]);
    } else {
      this.roleTask(creep);
    }
  }

  // 升级任务
  roleTask(creep: Creep): void {
    const targetController = creep.room.controller;
    if (!targetController) return;

    const upgradeResult = creep.upgradeController(targetController);

    switch (upgradeResult) {
      case ERR_NOT_IN_RANGE: {
        creep.moveTo(targetController, {
          visualizePathStyle: { stroke: '#ffffff' },
        });
        break;
      }
      case OK: {
        intervalSleep(10, () => creep.say(EMOJI.upgrading), {
          time: creep.ticksToLive,
        });
        break;
      }
    }
  }
}

export default new Upgrader();
