import { EnergyStoreTargetType } from '@/constant';
import { TaskExecuteStatusEnum } from '../taskSystem/executor';
import { Task } from '../utils/taskMap';
import { BaseRole, BaseRoleCreateParams } from './base';

const PriorityQueueOfStoreEnergy: Array<Structure['structureType']> = [
  STRUCTURE_EXTENSION,
  STRUCTURE_SPAWN,
  STRUCTURE_STORAGE,
  STRUCTURE_CONTAINER,
  STRUCTURE_LAB,
  STRUCTURE_TERMINAL,
  STRUCTURE_CONTAINER,
];

class Harvester extends BaseRole {
  static readonly role: Extract<CustomRoleType, 'harvester'> = 'harvester';

  constructor() {
    super(Harvester.role);
  }

  create(spawn: StructureSpawn, params: BaseRoleCreateParams): ScreepsReturnCode {
    const { body, name, memoryRoleOpts = { role: this.role } } = params;
    return this.baseCreate(spawn, body, name, { memory: memoryRoleOpts });
  }

  run(creep: Creep, task: Task) {
    switch (task.type) {
      case 'harvesting': {
        const harvestResult = this.baseHarvestTask(creep, task);
        if (harvestResult === ERR_NOT_IN_RANGE) {
          const targetStore = Game.getObjectById<NonNullable<EnergyStoreTargetType>>(task.toId);
          if (!targetStore) {
            return TaskExecuteStatusEnum.failed;
          }
          this.baseMoveTo(creep, targetStore);
        }
      }
      case 'transferring': {
        return this.roleTask(creep, task);
      }
      default:
        return TaskExecuteStatusEnum.inProgress;
    }
  }

  // 传输任务
  roleTask(creep: Creep, task: Task): TaskExecuteStatusEnum {
    const target = Game.getObjectById<Structure>(task.toId);
    if (!target) return TaskExecuteStatusEnum.failed;

    const transferResult = creep.transfer(target, RESOURCE_ENERGY);
    switch (transferResult) {
      case ERR_NOT_IN_RANGE: {
        this.baseMoveTo(creep, target);
        break;
      }
      case OK: {
        if (creep.store[RESOURCE_ENERGY] === 0) {
          this.baseSubmitTask(creep, task);
        }
        break;
      }
    }

    return TaskExecuteStatusEnum.inProgress;
  }
}

export default new Harvester();
