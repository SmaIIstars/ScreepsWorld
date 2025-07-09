import EMOJI from '@/constant/emoji';
import { intervalSleep } from '@/utils';
import { EnergyStoreTargetType, EnergyStoreType, findAvailableTargetByRange } from '@/utils/query';

export type BaseRoleType = {
  role: CustomRoleType;
  task: CustomRoleTaskType;
};

export type BaseRoleCreateParams = {
  baseId?: string;
  name?: string;
  body: BodyPartConstant[];
  memoryRoleOpts?: BaseRoleType;
};

export abstract class BaseRole {
  protected role: CustomRoleType;

  constructor(role: CustomRoleType) {
    this.role = role;
  }

  // abstract create(params: BaseRoleCreateParams): ScreepsReturnCode;
  abstract run(creep: Creep): void;
  abstract roleTask(creep: Creep): void;

  abstract create(params: BaseRoleCreateParams): ScreepsReturnCode;
  // {
  //   const { baseId = BASE_ID_ENUM.MainBase, body, name, memoryRoleOpts } = params;
  //   const curName = name ?? `${this.role}-${Game.time}`;
  //   return Game.spawns[baseId].spawnCreep(body, curName, { memory: memoryRoleOpts });
  // }

  /**
   * 从有能量的存储单位获取能量
   * @param creep
   * @param targetStoreType 有能量的存储单位类型
   * @description targetStoreType 是一个优先队列
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
        const targets =
          findAvailableTargetByRange(creep, targetStoreType, false)?.filter((target) => target !== null) ?? [];
        // es版本的兼容问题
        for (const target of targets) {
          if (target) allTargets.push(target);
        }
      }

      // 优先级定义: resource/ruin/tombstone > container/storage > miner > source > mineral/deposit
      // 其中miner满的优先于最近的
      let priorityTargets: NonNullable<EnergyStoreTargetType>[] = [];

      // 1. resource, ruin, tombstone
      priorityTargets = allTargets.filter(
        (t) =>
          (t instanceof Resource && t.resourceType === RESOURCE_ENERGY) || t instanceof Ruin || t instanceof Tombstone
      );

      if (priorityTargets.length > 0) {
        targetStore = creep.pos.findClosestByRange(priorityTargets);
      }

      // 2. container
      if (!targetStore) {
        priorityTargets = allTargets.filter((t) => t instanceof StructureContainer && t.store[RESOURCE_ENERGY] > 0);
        if (priorityTargets.length > 0) {
          targetStore = creep.pos.findClosestByRange(priorityTargets);
        }
      }

      // 2. storage
      if (!targetStore) {
        priorityTargets = allTargets.filter((t) => t instanceof StructureStorage && t.store[RESOURCE_ENERGY] > 0);
        if (priorityTargets.length > 0) {
          targetStore = creep.pos.findClosestByRange(priorityTargets);
        }
      }

      // 3. miner (Creep, role === 'miner')
      if (!targetStore) {
        const miners = allTargets.filter(
          (t) => t instanceof Creep && t.memory && t.memory.role === 'miner' && t.store[RESOURCE_ENERGY] > 0
        ) as Creep[];
        // 满的优先
        const fullMiners = miners.filter((c) => c.store.getFreeCapacity(RESOURCE_ENERGY) === 0);
        if (fullMiners.length > 0) {
          targetStore = creep.pos.findClosestByRange(fullMiners);
        } else if (miners.length > 0) {
          targetStore = creep.pos.findClosestByRange(miners);
        }
      }

      // 4. source
      if (!targetStore) {
        priorityTargets = allTargets.filter((t) => t instanceof Source);
        if (priorityTargets.length > 0) {
          targetStore = creep.pos.findClosestByRange(priorityTargets);
        }
      }

      // 5. mineral, deposit
      if (!targetStore) {
        priorityTargets = allTargets.filter((t) => t instanceof Mineral || t instanceof Deposit);
        if (priorityTargets.length > 0) {
          targetStore = creep.pos.findClosestByRange(priorityTargets);
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
      //   transfer: ['miner'],
      //   withdraw: ['ruin', 'tombstone', 'container', 'storage'],
      //   pick: ['resource'],
      if (targetStore instanceof Creep && targetStore.memory.role === 'miner') {
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
