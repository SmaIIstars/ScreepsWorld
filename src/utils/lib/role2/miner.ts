import { BASE_ID_ENUM } from '@/constant';
import EMOJI from '@/constant/emoji';
import { intervalSleep } from '@/utils';
import { BaseRole, BaseRoleCreateParams } from '../base/BaseRole';

class Miner extends BaseRole {
  static readonly role: Extract<CustomRoleType, 'miner'> = 'miner';

  constructor() {
    super(Miner.role);
  }

  create(params: BaseRoleCreateParams): ScreepsReturnCode {
    const { baseId = BASE_ID_ENUM.MainBase, body, name, memoryRoleOpts = { role: this.role, task: 'moving' } } = params;
    const curName = name ?? `${this.role}-${Game.time}`;
    return Game.spawns[baseId].spawnCreep(body, curName, { memory: memoryRoleOpts });
  }

  run(creep: Creep): void {
    if (creep.memory.task === 'moving') {
      this.moveTask(creep);
    } else {
      this.roleTask(creep);
    }
  }

  moveTask(creep: Creep): void {
    let targetSource: Source | null = null;
    if (creep.memory.targetId) {
      targetSource = Game.getObjectById<Source>(creep.memory.targetId);
    } else {
      const targetSources = Memory.sources.Source.map((sourceId) => Game.getObjectById<Source>(sourceId)).filter(
        (source) => source !== null
      );
      targetSource =
        targetSources.find((source) => {
          const miners = source.pos.findInRange(FIND_MY_CREEPS, 1, {
            filter: (curCreep) => curCreep.memory.role === 'miner' && curCreep.name !== creep.name,
          });
          return miners.length === 0;
        }) ?? null;
    }
    if (!targetSource) return;

    if (creep.pos.isNearTo(targetSource)) {
      creep.memory.task = 'mining';
      creep.memory.targetId = targetSource.id;
    } else {
      creep.moveTo(targetSource, { visualizePathStyle: { stroke: '#ffffff' } });
      intervalSleep(10, () => creep.say(EMOJI.moving));
    }
  }

  // 采矿任务
  roleTask(creep: Creep): void {
    // 如果周围有单位，则把能量转移给对方
    const targetCreep = creep.pos.findInRange(FIND_MY_CREEPS, 1, {
      filter: (creep) => creep.memory.role !== 'miner' && creep.store.getFreeCapacity(RESOURCE_ENERGY) > 0,
    });

    // 防止一直传给同一个单位(类似 Builder 在旁边修东西的特殊情况)
    for (const target of targetCreep) {
      if (creep.store[RESOURCE_ENERGY] > 0 && target.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
        creep.transfer(target, RESOURCE_ENERGY);
        intervalSleep(10, () => creep.say(EMOJI.transferring));
      }
    }

    if (creep.memory.targetId) {
      const targetSource = Game.getObjectById<Source>(creep.memory.targetId);
      if (targetSource) {
        creep.harvest(targetSource);
        intervalSleep(10, () => creep.say(EMOJI.mining));
      }
      return;
    }
    // 没找到 targetSource
    creep.memory.task = 'moving';
  }
}

export default new Miner();
