import { BaseRole, BaseRoleCreateParams } from './base';

import { EnergyStoreTargetType } from '@/constant';
import { TaskExecuteStatusEnum } from '../taskSystem/executor';
import type { Task } from '../utils/taskMap';

class Upgrader extends BaseRole {
  static readonly role: Extract<CustomRoleType, 'upgrader'> = 'upgrader';

  constructor() {
    super(Upgrader.role);
  }

  create(spawn: StructureSpawn, params: BaseRoleCreateParams): ScreepsReturnCode {
    const { body, name, memoryRoleOpts = { role: this.role } } = params;
    return this.baseCreate(spawn, body, name, { memory: memoryRoleOpts });
  }

  run(creep: Creep, task: Task) {
    switch (task.type) {
      case 'upgrading': {
        return this.roleTask(creep, task);
      }
      case 'harvesting': {
        const harvestResult = this.baseHarvestTask(creep, task);
        if (harvestResult === ERR_NOT_IN_RANGE) {
          const targetStore = Game.getObjectById<NonNullable<EnergyStoreTargetType>>(task.toId);
          if (!targetStore) return TaskExecuteStatusEnum.failed;
          this.baseMoveTo(creep, targetStore);
        }
      }
      default:
        return TaskExecuteStatusEnum.inProgress;
    }
  }

  // 升级任务
  roleTask(creep: Creep, task: Task): TaskExecuteStatusEnum {
    const targetController = Game.getObjectById<StructureController>(task.toId);
    if (!targetController) return TaskExecuteStatusEnum.failed;
    const upgradeResult = creep.upgradeController(targetController);
    switch (upgradeResult) {
      case ERR_NOT_IN_RANGE: {
        this.baseMoveTo(creep, targetController);
      }
    }

    if (creep.store.energy === 0) {
      this.baseSubmitTask(creep, task);
    }

    return TaskExecuteStatusEnum.inProgress;
  }
}

export default new Upgrader();
