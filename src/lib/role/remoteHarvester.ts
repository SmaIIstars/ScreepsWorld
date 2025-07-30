// import { TaskExecuteStatusEnum } from '../taskSystem/executor';
// import { Task, TaskMap } from '../utils/taskMap';
// import { BaseRole, BaseRoleCreateParams } from './base';

// class RemoteHarvester extends BaseRole {
//   static readonly role: Extract<CustomRoleType, 'remoteHarvester'> = 'remoteHarvester';

//   constructor() {
//     super(RemoteHarvester.role);
//   }

//   create(spawn: StructureSpawn, params: BaseRoleCreateParams): ScreepsReturnCode {
//     const { body, name, memoryRoleOpts = { role: this.role } } = params;
//     return this.baseCreate(spawn, body, name, { memory: memoryRoleOpts });
//   }

//   run(creep: Creep, taskId: string): TaskExecuteStatusEnum {
//     const task = global.rooms[creep.room.name]?.taskMap?.get(taskId);
//     if (!task) return TaskExecuteStatusEnum.failed;

//     if (task.type === 'remoteHarvesting') {
//       return this.roleTask(creep, task as Task<'remoteHarvesting'>);
//     }
//     return TaskExecuteStatusEnum.failed;
//   }

//   roleTask(creep: Creep, task: Task<'remoteHarvesting'>): TaskExecuteStatusEnum {
//     const targetRoomName = task.targetRoomName;
//     if (!targetRoomName) return TaskExecuteStatusEnum.failed;

//     // 如果不在目标房间，先移动过去
//     if (creep.room.name !== targetRoomName) {
//       const moveResult = this.moveToRoom(creep, targetRoomName);
//       return moveResult ? TaskExecuteStatusEnum.inProgress : TaskExecuteStatusEnum.failed;
//     }

//     // 在目标房间，执行挖矿任务
//     const source = Game.getObjectById<Source>(task.toId);
//     if (!source) return TaskExecuteStatusEnum.failed;

//     // 检查并建造基础设施
//     this.checkInfrastructure(creep, source);

//     const harvestResult = creep.harvest(source);
//     if (harvestResult === ERR_NOT_IN_RANGE) {
//       this.baseMoveTo(creep, source);
//     } else if (harvestResult === ERR_NOT_ENOUGH_RESOURCES) {
//       // source枯竭，任务完成
//       this.baseSubmitTask(creep, task.id);
//       return TaskExecuteStatusEnum.completed;
//     } else if (harvestResult === OK) {
//       // 如果满了，存储到container
//       if (creep.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
//         this.depositToContainer(creep, source);
//       }
//       return TaskExecuteStatusEnum.inProgress;
//     }

//     return TaskExecuteStatusEnum.failed;
//   }

//   claimTask(creep: Creep, taskMap: TaskMap): string | undefined {
//     // 优先认领外矿挖掘任务
//     const remoteHarvestingTasks = taskMap.taskPriorityQueue('remote_harvesting');
//     return remoteHarvestingTasks[0]?.id;
//   }

//   private moveToRoom(creep: Creep, targetRoomName: string): boolean {
//     const exitDir = Game.map.findExit(creep.room.name, targetRoomName);
//     if (exitDir === ERR_NO_PATH) return false;

//     const exit = creep.pos.findClosestByPath(exitDir);
//     if (exit) {
//       creep.moveTo(exit, { visualizePathStyle: { stroke: '#ffaa00' } });
//       return true;
//     }
//     return false;
//   }

//   private checkInfrastructure(creep: Creep, source: Source): void {
//     // 检查是否需要建造container
//     const containers = source.pos.findInRange(FIND_STRUCTURES, 2, {
//       filter: (s) => s.structureType === STRUCTURE_CONTAINER,
//     });

//     const constructionSites = source.pos.findInRange(FIND_CONSTRUCTION_SITES, 2, {
//       filter: (s) => s.structureType === STRUCTURE_CONTAINER,
//     });

//     if (containers.length === 0 && constructionSites.length === 0) {
//       // 需要建造container
//       const buildPos = this.findOptimalContainerPosition(source);
//       if (buildPos) {
//         creep.room.createConstructionSite(buildPos, STRUCTURE_CONTAINER);
//       }
//     }

//     // 建造construction sites
//     if (constructionSites.length > 0 && creep.store.energy > 0) {
//       const site = constructionSites[0];
//       if (creep.build(site) === ERR_NOT_IN_RANGE) {
//         this.baseMoveTo(creep, site);
//       }
//     }
//   }

//   private depositToContainer(creep: Creep, source: Source): void {
//     const containers = source.pos.findInRange(FIND_STRUCTURES, 2, {
//       filter: (s) => s.structureType === STRUCTURE_CONTAINER && s.store.getFreeCapacity(RESOURCE_ENERGY) > 0,
//     });

//     if (containers.length > 0) {
//       const container = containers[0];
//       if (creep.transfer(container, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
//         this.baseMoveTo(creep, container);
//       }
//     } else {
//       // 没有container，直接丢弃
//       creep.drop(RESOURCE_ENERGY);
//     }
//   }

//   private findOptimalContainerPosition(source: Source): RoomPosition | null {
//     const terrain = new Room.Terrain(source.room!.name);

//     for (let dx = -1; dx <= 1; dx++) {
//       for (let dy = -1; dy <= 1; dy++) {
//         if (dx === 0 && dy === 0) continue;

//         const x = source.pos.x + dx;
//         const y = source.pos.y + dy;

//         if (x < 1 || x > 48 || y < 1 || y > 48) continue;
//         if (terrain.get(x, y) === TERRAIN_MASK_WALL) continue;

//         const pos = new RoomPosition(x, y, source.room!.name);
//         const structures = pos.lookFor(LOOK_STRUCTURES);
//         if (structures.length > 0) continue;

//         return pos;
//       }
//     }

//     return null;
//   }
// }

// export default new RemoteHarvester();
