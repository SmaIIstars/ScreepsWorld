// import { TaskExecuteStatusEnum } from '../taskSystem/executor';
// import { Task, TaskMap } from '../utils/taskMap';
// import { BaseRole, BaseRoleCreateParams } from './base';

// class RemoteHauler extends BaseRole {
//   static readonly role: Extract<CustomRoleType, 'remoteHauler'> = 'remoteHauler';

//   constructor() {
//     super(RemoteHauler.role);
//   }

//   create(spawn: StructureSpawn, params: BaseRoleCreateParams): ScreepsReturnCode {
//     const { body, name, memoryRoleOpts = { role: this.role } } = params;
//     return this.baseCreate(spawn, body, name, { memory: memoryRoleOpts });
//   }

//   run(creep: Creep, taskId: string): TaskExecuteStatusEnum {
//     const task = global.rooms[creep.room.name]?.taskMap?.get(taskId);
//     if (!task) return TaskExecuteStatusEnum.failed;

//     if (task.type === 'remoteTransporting') {
//       return this.roleTask(creep, task as Task<'remoteTransporting'>);
//     }
//     return TaskExecuteStatusEnum.failed;
//   }

//   roleTask(creep: Creep, task: Task<'remoteTransporting'>): TaskExecuteStatusEnum {
//     const targetRoomName = task.targetRoomName;
//     const baseRoomName = task.fromId;

//     if (!targetRoomName || !baseRoomName) return TaskExecuteStatusEnum.failed;

//     // 如果是探索任务
//     if (task.payload?.isExploration) {
//       return this.explorationTask(creep, targetRoomName, task);
//     }

//     // 普通运输任务
//     if (creep.store.energy === 0) {
//       return this.collectEnergy(creep, targetRoomName, task);
//     } else {
//       return this.deliverEnergy(creep, baseRoomName, task);
//     }
//   }

//   private explorationTask(
//     creep: Creep,
//     targetRoomName: string,
//     task: Task<'remoteTransporting'>
//   ): TaskExecuteStatusEnum {
//     // 移动到目标房间进行探索
//     if (creep.room.name !== targetRoomName) {
//       const moveResult = this.moveToRoom(creep, targetRoomName);
//       return moveResult ? TaskExecuteStatusEnum.inProgress : TaskExecuteStatusEnum.failed;
//     }

//     // 到达目标房间，探索完成
//     console.log(`[外矿探索] ${creep.name} 成功探索房间 ${targetRoomName}`);
//     this.baseSubmitTask(creep, task.id);
//     return TaskExecuteStatusEnum.completed;
//   }

//   claimTask(creep: Creep, taskMap: TaskMap): string | undefined {
//     // 如果没有能量，认领运输任务
//     if (creep.store.energy === 0) {
//       const transportTasks = taskMap.taskPriorityQueue('remoteTransporting');
//       return transportTasks[0]?.id;
//     }
//     return undefined;
//   }

//   private collectEnergy(creep: Creep, targetRoomName: string, task: Task<'remoteTransporting'>): TaskExecuteStatusEnum {
//     // 移动到目标房间
//     if (creep.room.name !== targetRoomName) {
//       const moveResult = this.moveToRoom(creep, targetRoomName);
//       return moveResult ? TaskExecuteStatusEnum.inProgress : TaskExecuteStatusEnum.failed;
//     }

//     // 在目标房间收集资源
//     const collected = this.collectResources(creep);
//     if (!collected) {
//       // 没有资源可收集，任务完成
//       this.baseSubmitTask(creep, task.id);
//       return TaskExecuteStatusEnum.completed;
//     }

//     return TaskExecuteStatusEnum.inProgress;
//   }

//   private deliverEnergy(creep: Creep, baseRoomName: string, task: Task<'remoteTransporting'>): TaskExecuteStatusEnum {
//     // 移动到基地房间
//     if (creep.room.name !== baseRoomName) {
//       const moveResult = this.moveToRoom(creep, baseRoomName);
//       return moveResult ? TaskExecuteStatusEnum.inProgress : TaskExecuteStatusEnum.failed;
//     }

//     // 在基地房间存储能量
//     const delivered = this.deliverResources(creep);
//     if (delivered) {
//       return TaskExecuteStatusEnum.inProgress;
//     } else {
//       // 存储完成，任务完成
//       this.baseSubmitTask(creep, task.id);
//       return TaskExecuteStatusEnum.completed;
//     }
//   }

//   private moveToRoom(creep: Creep, targetRoomName: string): boolean {
//     const exitDir = Game.map.findExit(creep.room.name, targetRoomName);
//     if (exitDir === ERR_NO_PATH) return false;

//     const exit = creep.pos.findClosestByPath(exitDir);
//     if (exit) {
//       creep.moveTo(exit, { visualizePathStyle: { stroke: '#00ff00' } });
//       return true;
//     }
//     return false;
//   }

//   private collectResources(creep: Creep): boolean {
//     // 优先从container收集
//     const containers = creep.room.find(FIND_STRUCTURES, {
//       filter: (s) => s.structureType === STRUCTURE_CONTAINER && s.store.energy > 0,
//     });

//     if (containers.length > 0) {
//       const container = creep.pos.findClosestByPath(containers);
//       if (container) {
//         const withdrawResult = creep.withdraw(container, RESOURCE_ENERGY);
//         if (withdrawResult === ERR_NOT_IN_RANGE) {
//           this.baseMoveTo(creep, container);
//         }
//         return true;
//       }
//     }

//     // 收集掉落的能量
//     const droppedEnergy = creep.room.find(FIND_DROPPED_RESOURCES, {
//       filter: (r) => r.resourceType === RESOURCE_ENERGY && r.amount > 50,
//     });

//     if (droppedEnergy.length > 0) {
//       const energy = creep.pos.findClosestByPath(droppedEnergy);
//       if (energy) {
//         const pickupResult = creep.pickup(energy);
//         if (pickupResult === ERR_NOT_IN_RANGE) {
//           this.baseMoveTo(creep, energy);
//         }
//         return true;
//       }
//     }

//     return false; // 没有资源可收集
//   }

//   private deliverResources(creep: Creep): boolean {
//     // 优先给spawn和extension
//     const targets = creep.room.find(FIND_STRUCTURES, {
//       filter: (structure) => {
//         return (
//           (structure.structureType === STRUCTURE_EXTENSION ||
//             structure.structureType === STRUCTURE_SPAWN ||
//             structure.structureType === STRUCTURE_TOWER) &&
//           structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
//         );
//       },
//     });

//     if (targets.length > 0) {
//       const target = creep.pos.findClosestByPath(targets);
//       if (target) {
//         const transferResult = creep.transfer(target, RESOURCE_ENERGY);
//         if (transferResult === ERR_NOT_IN_RANGE) {
//           this.baseMoveTo(creep, target);
//         }
//         return true;
//       }
//     }

//     // 存储到storage
//     const storage = creep.room.find(FIND_STRUCTURES, {
//       filter: (s) => s.structureType === STRUCTURE_STORAGE && s.store.getFreeCapacity(RESOURCE_ENERGY) > 0,
//     })[0];

//     if (storage) {
//       const transferResult = creep.transfer(storage, RESOURCE_ENERGY);
//       if (transferResult === ERR_NOT_IN_RANGE) {
//         this.baseMoveTo(creep, storage);
//       }
//       return true;
//     }

//     return false; // 无处存储
//   }
// }

// export default new RemoteHauler();
