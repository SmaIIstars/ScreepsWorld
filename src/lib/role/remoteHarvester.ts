// import { EnergyStoreTargetType } from '@/constant';
// import { Task, TaskMap, TaskStatusEnum } from '../utils/taskMap';
// import { BaseRole, BaseRoleCreateParams } from './base';
// import { Harvester } from './harvester';
// import { TaskExecuteStatusEnum } from '../taskSystem/executor';

// class RemoteHarvester extends Harvester {
//   static readonly role: Extract<CustomRoleType, 'remoteHarvester'> = 'remoteHarvester';

//   constructor() {
//     super(RemoteHarvester.role);
//   }

//   create(spawn: StructureSpawn, params: BaseRoleCreateParams): ScreepsReturnCode {
//     const { body, name, memoryRoleOpts = { role: this.role } } = params;
//     return this.baseCreate(spawn, body, name, { memory: memoryRoleOpts });
//   }

//   run(creep: Creep, taskId: string) {
//     return super.run(creep, taskId);
//   }

//   // 采矿任务
//   roleTask(creep: Creep, task: Task<'transferring'>): TaskExecuteStatusEnum {
//     // return super.roleTask(creep, task);
//     return TaskExecuteStatusEnum.failed;
//   }

//   claimTask(creep: Creep, taskMap: TaskMap) {
//     if (creep.store[RESOURCE_ENERGY] === 0) {
//       if (creep.memory.targetRoom) {
//         // 如果有目标房间但是当前不在目标房间, 则移动到目标房间
//         if (creep.room.name !== creep.memory.targetRoom) {
//           this.baseMoveTo(creep, Game.flags[creep.memory.targetRoom]);
//           return undefined;
//         } else {
//           // 如果在目标房间但是没有任务，则认领任务
//           const harvestingTasks = taskMap.taskPriorityQueue('harvesting', {
//             filter: (task) => {
//               if (task.type !== 'harvesting') return false;
//               return true;
//             },
//           });
//           return harvestingTasks[0]?.id;
//         }
//       } else {
//         // 如果没有目标房间，则寻找一个有采集任务且未被领取的房间作为目标房间
//         const otherRooms = creep.room.memory.sourceRooms?.filter((roomName) => roomName !== creep.room.name);
//         if (!otherRooms) return undefined;
//         for (const roomName of otherRooms) {
//           const harvestingTasks = global.rooms[roomName].taskMap?.taskPriorityQueue('harvesting', {
//             filter: (task) => {
//               if (task.type !== 'harvesting') return false;
//               if (task.toRoomName !== roomName) return false;
//               return true;
//             },
//           });
//           if (harvestingTasks[0]) {
//             creep.memory.targetRoom = roomName;
//             return harvestingTasks[0]?.id;
//           }
//         }
//       }
//     }

//     return super.claimTask(creep, taskMap);
//   }
// }

// export default new RemoteHarvester();
