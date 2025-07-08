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
  memoryRoleOpts: BaseRoleType;
};

export abstract class BaseRole {
  protected role: CustomRoleType;

  constructor(role: CustomRoleType) {
    this.role = role;
  }

  abstract create(params: BaseRoleCreateParams): ScreepsReturnCode;
  abstract run(creep: Creep): void;
  abstract roleTask(creep: Creep): void;

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
