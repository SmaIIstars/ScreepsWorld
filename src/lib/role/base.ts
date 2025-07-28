import { EnergyStoreTargetType } from '@/constant';
import { TaskExecuteStatusEnum } from '../taskSystem/executor';
import type { Task } from '../utils/taskMap';

export type BaseRoleType = {
  role: CustomRoleType;
};

export type BaseRoleCreateParams = {
  name?: string;
  body: BodyPartConstant[];
  memoryRoleOpts?: BaseRoleType;
};

export abstract class BaseRole {
  protected role: CustomRoleType;

  constructor(role: CustomRoleType) {
    this.role = role;
  }

  /**
   * 生成角色body
   * @param bodyWidgetConfig
   * @returns BodyPartConstant[]
   */
  static generatorRoleBody = (bodyWidgetConfig: { body: BodyPartConstant; count: number }[]) => {
    // flatMap 不兼容 es2019
    // bodyWidgetConfig.flatMap(({ body, count }) => Array(count).fill(body));
    return bodyWidgetConfig.reduce<BodyPartConstant[]>((acc, { body, count }) => {
      return acc.concat(Array(count).fill(body));
    }, []);
  };

  // abstract create(params: BaseRoleCreateParams): ScreepsReturnCode;
  abstract run(creep: Creep, task: Task): TaskExecuteStatusEnum;
  // abstract roleTask(creep: Creep): void;
  baseCreate = (
    spawn: StructureSpawn,
    body: BodyPartConstant[],
    name?: string,
    opts?: SpawnOptions
  ): ScreepsReturnCode => {
    const curName = name ?? `${this.role}-${Game.time}`;
    return spawn.spawnCreep(body, curName, opts);
  };

  baseHarvestTask = (creep: Creep, task: Task): ScreepsReturnCode => {
    if (creep.store.getFreeCapacity() === 0) {
      this.baseSubmitTask(creep, task);
      return OK;
    }

    // 通过toId拿到目标对象，再判断类型
    const targetStore: EnergyStoreTargetType = Game.getObjectById(task.toId);

    if (targetStore) {
      let returnCode: ScreepsReturnCode = OK;

      if (targetStore instanceof Creep) {
        // Just wait creep transfer
        returnCode = creep.pos.isNearTo(targetStore) ? OK : ERR_NOT_IN_RANGE;
      } else if (targetStore instanceof Source || targetStore instanceof Mineral) {
        returnCode = creep.harvest(targetStore);
      } else if (targetStore instanceof Resource) {
        returnCode = creep.pickup(targetStore);
      } else {
        // targetStore instanceof Ruin ||
        // targetStore instanceof Tombstone ||
        // targetStore instanceof StructureStorage ||
        // targetStore instanceof StructureContainer ||
        // targetStore instanceof StructureLink ||
        // targetStore instanceof StructureTerminal
        returnCode = creep.withdraw(targetStore, RESOURCE_ENERGY);
      }

      return returnCode;
    }

    return ERR_INVALID_TARGET;
  };

  baseMoveTo = (creep: Creep, target: RoomPosition | { pos: RoomPosition }) => {
    if (!creep.pos.isNearTo(target)) creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' } });
  };

  baseSubmitTask = (creep: Creep, task: Task) => {
    if (creep.memory.currentTask && task && task.id === creep.memory.currentTask) {
      const idx = task.assignedTo?.indexOf(creep.name);
      if (idx !== undefined && idx !== -1) {
        task.assignedTo?.splice(idx, 1);
      }
      delete creep.memory.currentTask;
    }
  };
}
