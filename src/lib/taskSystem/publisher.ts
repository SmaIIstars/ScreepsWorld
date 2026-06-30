import { HarvestingPayload, Task, TaskMap, TaskPublisherType, TaskStatusEnum } from '@/lib/utils/taskMap';
import { getStrategy } from '@/strategy';
import { AllStoreStructure } from '@/types';
import { checkNeedMineralMiner, isCustomRoleType } from '../utils';

/**
 * 任务发布器
 * 负责根据房间状态发布各种任务
 */
export class TaskPublisher {
  private taskMap: TaskMap;

  constructor(taskMap: TaskMap) {
    this.taskMap = taskMap;
  }

  /**
   * 发布任务
   * @param room 房间对象
   */
  publishTasks(room: Room): void {
    this.publishHarvestTasks(room);
    this.publishUpgradeTasks(room);
    this.publishBuildTasks(room);
    this.publishRepairTasks(room);
    this.publishTransferTasks(room);
    this.publishGenerateRoomTasks(room);
  }

  /**
   * 发布采集任务
   */
  private publishHarvestTasks(room: Room): void {
    const roomMemory = global.rooms[room.name];
    if (!roomMemory?.sources) return;

    // 资源开采类
    // 遍历所有资源类型并处理
    Object.entries(roomMemory.sources).forEach(([type, ids]) => {
      if (!ids) return;
      ids.forEach((id) => {
        const target = Game.getObjectById<Source | Resource | Ruin | Tombstone | Mineral>(id);
        if (!target) return;
        if (!room.controller?.my && target instanceof Mineral) return;
        if (target instanceof Mineral) {
          const extractor = room.find<StructureExtractor>(FIND_MY_STRUCTURES, {
            filter: (s) => s.structureType === STRUCTURE_EXTRACTOR,
          })?.[0];
          if (!extractor || extractor.pos.getPosition() !== target.pos.getPosition()) return;
        }
        const roles: CustomRoleType[] = ['source', 'mineral'].includes(type)
          ? ['miner', 'harvester', 'remoteMiner']
          : ['harvester', 'remoteHarvester'];
        this.createHarvestTask(target, room, roles);
      });
    });

    // 存储容器获取类
    const sourceStores: (
      | StructureContainer
      | StructureStorage
      | StructureTerminal
      | StructureLink
      | StructurePowerBank
    )[] = room.controller?.my
      ? room.find(FIND_STRUCTURES, {
          filter: (structure) => {
            if (structure.structureType === STRUCTURE_CONTAINER) return !!structure.store[RESOURCE_ENERGY];
            if (structure.structureType === STRUCTURE_STORAGE) return !!structure.store[RESOURCE_ENERGY];
            if (structure.structureType === STRUCTURE_TERMINAL) return structure.store[RESOURCE_ENERGY] > 15000;
            if (structure.structureType === STRUCTURE_LAB) return !!structure.store[RESOURCE_ENERGY];
            if (structure.structureType === STRUCTURE_NUKER) return !!structure.store[RESOURCE_ENERGY];
            if (structure.structureType === STRUCTURE_LINK) {
              const links = global.rooms[room.name].structure?.link;
              return links?.find((l) => l.id === structure.id && ['spawn', 'controller'].includes(l?.type));
            }
            return false;
          },
        })
      : room.find(FIND_STRUCTURES, {
          filter: (s) => {
            if (s.structureType === STRUCTURE_CONTROLLER) return false;
            if (s.structureType === STRUCTURE_EXTRACTOR) return false;
            if (s.structureType === STRUCTURE_INVADER_CORE) return false;
            if (s.structureType === STRUCTURE_KEEPER_LAIR) return false;
            if (s.structureType === STRUCTURE_OBSERVER) return false;
            if (s.structureType === STRUCTURE_POWER_BANK) return false;
            if (s.structureType === STRUCTURE_RAMPART) return false;
            if (s.structureType === STRUCTURE_PORTAL) return false;
            if (s.structureType === STRUCTURE_ROAD) return false;
            if (s.structureType === STRUCTURE_WALL) return false;
            return Object.values(s.store).some((v) => v);
          },
        });

    const powerBank = room.find(FIND_STRUCTURES, { filter: (s) => s.structureType === STRUCTURE_POWER_BANK })[0];
    if (powerBank) sourceStores.push(powerBank);

    sourceStores.forEach((structure) => {
      this.createHarvestTask(structure, room, ['harvester', 'remoteHarvester']);
    });
  }

  /**
   * 创建采集任务
   */
  private createHarvestTask(
    target:
      | Source
      | Resource
      | Ruin
      | Tombstone
      | Mineral
      | StructureContainer
      | StructureStorage
      | StructureTerminal
      | StructureLink
      // | StructureNuker
      | StructureExtension
      | StructureSpawn
      | StructurePowerBank,
    room: Room,
    allowedRoles: CustomRoleType[]
  ): void {
    const taskId = `harvest_${target.id}`;

    const payload: HarvestingPayload = {};
    let publisherType: TaskPublisherType = LOOK_SOURCES;
    if (target instanceof Source) {
      payload[RESOURCE_ENERGY] = target.energy;
      publisherType = LOOK_SOURCES;
    } else if (target instanceof Resource) {
      publisherType = LOOK_RESOURCES;
      payload[target.resourceType] = target.amount;
    } else if (target instanceof Mineral) {
      publisherType = LOOK_MINERALS;
      payload[target.mineralType] = target.mineralAmount;
    } else if (
      target instanceof Ruin ||
      target instanceof Tombstone ||
      target instanceof StructureContainer ||
      target instanceof StructureStorage ||
      target instanceof StructureTerminal ||
      target instanceof StructureLink ||
      // target instanceof StructureNuker ||
      target instanceof StructureExtension ||
      target instanceof StructureSpawn
    ) {
      if (target instanceof Ruin) {
        publisherType = LOOK_RUINS;
      } else if (target instanceof Tombstone) {
        publisherType = LOOK_TOMBSTONES;
      } else if (target instanceof StructureContainer) {
        publisherType = STRUCTURE_CONTAINER;
      } else if (target instanceof StructureStorage) {
        publisherType = STRUCTURE_STORAGE;
      } else if (target instanceof StructureTerminal) {
        publisherType = STRUCTURE_TERMINAL;
      } else if (target instanceof StructureLink) {
        publisherType = STRUCTURE_LINK;
        // } else if (target instanceof StructureNuker) {
        //   publisherType = STRUCTURE_NUKER;
      } else if (target instanceof StructureExtension) {
        publisherType = STRUCTURE_EXTENSION;
      } else if (target instanceof StructureSpawn) {
        publisherType = STRUCTURE_SPAWN;
      }

      for (const resourceType in target.store) {
        payload[resourceType as ResourceConstant] = target.store[resourceType as ResourceConstant];
      }
    } else if (target instanceof StructurePowerBank) {
      publisherType = STRUCTURE_POWER_BANK;
      payload[RESOURCE_POWER] = target.power;
    }

    const hasSource = Object.values(payload).reduce((a, b) => a + b, 0) > 0;
    if (this.taskMap.hasTask(taskId)) {
      if (!hasSource) {
        this.taskMap.updateTask(taskId, { status: TaskStatusEnum.completed });
      } else {
        this.taskMap.updateTask(taskId, { payload });
      }
    } else {
      if (!hasSource) return;

      const task: Task<'harvesting'> = {
        id: taskId,
        publisherType,
        publisher: target.id,
        type: 'harvesting',
        toId: target.id,
        allowedCreepRoles: allowedRoles,
        payload,
        timestamp: Game.time,
        status: TaskStatusEnum.published,
        room: room.name,
        needCreepCount: target instanceof StructureStorage ? 3 : 1,
        assignedTo: [],
      };
      this.taskMap.publish(task);
    }
  }

  /**
   * 发布升级任务
   */
  private publishUpgradeTasks(room: Room): void {
    if (room.controller && room.controller.my) {
      const taskId = `upgrade_${room.controller.id}`;

      if (!this.taskMap.hasTask(taskId)) {
        const task: Task<'upgrading'> = {
          id: taskId,
          type: 'upgrading',
          publisherType: STRUCTURE_CONTROLLER,
          publisher: room.controller.id,
          toId: room.controller.id,
          allowedCreepRoles: ['upgrader'],
          payload: {
            progress: room.controller.progress,
            progressTotal: room.controller.progressTotal,
            level: room.controller.level,
          },
          room: room.name,
          assignedTo: [],
          timestamp: Game.time,
          needCreepCount: 1,
          status: TaskStatusEnum.published,
        };

        this.taskMap.publish(task);
      }
    }
  }

  /**
   * 发布建造任务
   */
  private publishBuildTasks(room: Room): void {
    const constructionSites = room.find(FIND_CONSTRUCTION_SITES);

    for (const site of constructionSites) {
      const taskId = `build_${site.id}`;

      if (!this.taskMap.hasTask(taskId)) {
        const task: Task = {
          id: taskId,
          publisherType: site.structureType,
          type: 'building',
          publisher: site.id,
          toId: site.id,
          allowedCreepRoles: ['builder'],
          payload: {
            structureType: site.structureType,
            progress: site.progress,
            progressTotal: site.progressTotal,
          },
          room: room.name,
          assignedTo: [],
          timestamp: Game.time,
          needCreepCount: 1,
          status: TaskStatusEnum.published,
        };

        this.taskMap.publish(task);
      }
    }
  }

  /**
   * 发布维修任务
   */
  private publishRepairTasks(room: Room): void {
    // 主房之外的建筑不需要维修
    if (!room.controller?.my) return;

    const structures = room.find(FIND_STRUCTURES, {
      filter: (structure) => {
        if (structure.structureType === STRUCTURE_WALL || structure.structureType === STRUCTURE_RAMPART) {
          return structure.hits < 1000000;
        } else {
          return structure.hits < structure.hitsMax * 0.6;
        }
      },
    });

    for (const structure of structures) {
      const taskId = `repair_${structure.id}`;

      if (!this.taskMap.hasTask(taskId)) {
        const task: Task = {
          id: taskId,
          type: 'repairing',
          publisherType: structure.structureType,
          publisher: structure.id,
          toId: structure.id,
          allowedCreepRoles: ['repairer', 'builder'],
          payload: {
            structureType: structure.structureType,
            hits: structure.hits,
            hitsMax: structure.hitsMax,
          },
          room: room.name,
          needCreepCount: 1,
          assignedTo: [],
          timestamp: Game.time,
          status: TaskStatusEnum.published,
        };

        this.taskMap.publish(task);
      }
    }
  }

  /**
   * 发布传输任务
   */
  private publishTransferTasks(room: Room): void {
    // TODO:可以优化只遍历一次就确定类型，使用一个Map存储，减少后续发布任务再遍历判断
    const allStoreStructures = room.find<AllStoreStructure>(FIND_MY_STRUCTURES, {
      filter: (structure) => {
        if (
          [
            STRUCTURE_TOWER,
            STRUCTURE_SPAWN,
            STRUCTURE_EXTENSION,
            STRUCTURE_POWER_SPAWN,
            STRUCTURE_STORAGE,
            STRUCTURE_CONTAINER,
          ].some((type) => structure.structureType === type)
        ) {
          return true;
        }
        if (structure instanceof StructureLab) return structure.store.getFreeCapacity(RESOURCE_ENERGY);

        // if (structure instanceof StructureLink) return structure.store.getFreeCapacity(RESOURCE_ENERGY);
        if (structure instanceof StructureTerminal) return structure.store.getFreeCapacity(RESOURCE_ENERGY);
        if (structure instanceof StructureNuker) return structure.store.getFreeCapacity(RESOURCE_ENERGY);
        return false;
      },
    });

    // 遍历所有存储结构并发布传输任务
    for (const structure of allStoreStructures) {
      const taskId = `transfer_${structure.id}`;
      const freeCapacity = structure.store.getFreeCapacity(RESOURCE_ENERGY) ?? 0;

      if (this.taskMap.hasTask(taskId)) {
        if (freeCapacity === 0) {
          this.taskMap.updateTask(taskId, { status: TaskStatusEnum.completed });
        } else {
          const task = this.taskMap.get<'transferring'>(taskId);
          if (!task) continue;
          this.taskMap.updateTask(taskId, {
            payload: { ...task.payload, freeCapacity },
          });
        }
        continue;
      } else if (freeCapacity > 0) {
        let resourceTypes: ResourceConstant[] | undefined = undefined;
        if ([StructureTower, StructureSpawn, StructureExtension].some((type) => structure instanceof type)) {
          resourceTypes = [RESOURCE_ENERGY];
        } else if (structure instanceof StructurePowerSpawn) {
          resourceTypes = [RESOURCE_ENERGY, RESOURCE_POWER];
        }

        // 发布任务
        const task: Task<'transferring'> = {
          id: taskId,
          type: 'transferring',
          publisherType: structure.structureType,
          publisher: structure.id,
          toId: structure.id,
          allowedCreepRoles: ['harvester'],
          payload: { resourceTypes, freeCapacity },
          timestamp: Game.time,
          status: TaskStatusEnum.published,
          room: room.name,
          assignedTo: [],
          needCreepCount: -1,
        };

        this.taskMap.publish(task);
      }
    }
  }

  /**
   * 发布插旗任务
   */
  // private publishScoutRoomTasks(room: Room): void {
  //   const sourceRooms = room.memory.sourceRooms ?? [];
  //   sourceRooms.forEach((roomName) => {
  //     // 发布一个RemoteMiner任务进行侦察
  //     const taskId = `scout_${roomName}`;
  //     if (this.taskMap.hasTask(taskId)) return;

  //     const sourceRoom = Game.rooms[roomName];
  //     if (!sourceRoom) return;
  //     const curCreepsCount = sourceRoom.memory.creepsCount;
  //     const flagCreepsCount = Game.flags[roomName].memory.payload;
  //     if ((curCreepsCount?.remoteMiner ?? 0) >= (flagCreepsCount.remoteMiners ?? 0)) return;

  //     const task: Task<'scouting'> = {
  //       id: taskId,
  //       type: 'scouting',
  //       publisherType: LOOK_FLAGS,
  //       publisher: room.controller?.id ?? '',
  //       toId: roomName,
  //       allowedCreepRoles: ['remoteMiner'],
  //       needCreepCount: flagCreepsCount.remoteMiners,
  //       payload: { taskType: 'source' },
  //       status: TaskStatusEnum.published,
  //       room: room.name,
  //       assignedTo: sourceRoom
  //         .find(FIND_MY_CREEPS, { filter: (c) => c.memory.role === 'remoteMiner' && c.memory.targetRoom === roomName })
  //         .map((c) => c.name),
  //     };

  //     this.taskMap.publish(task);
  //   });
  // }

  private publishGenerateRoomTasks(room: Room): void {
    if (!room.controller) return;
    const roomMemory = global.rooms[room.name];
    const roomFlag = Game.flags[room.name];
    if (!roomMemory || !roomFlag) return;
    const flagCreeps = roomFlag.memory.payload.creeps;
    if (!flagCreeps) return;

    for (const role in flagCreeps) {
      if (!isCustomRoleType(role)) continue;
      const needMineralMiner = checkNeedMineralMiner(room);
      let flagRoleCreepNumber = flagCreeps[role] ?? 0;
      if (role === 'miner' && needMineralMiner) flagRoleCreepNumber += 1;
      if (!flagRoleCreepNumber) continue;
      const curRoleCreepNum = Object.values(Game.creeps).filter((c) => {
        const { role: cRole, bornRoom } = c.memory;
        return role === cRole && bornRoom === room.name;
      }).length;

      if (curRoleCreepNum >= flagRoleCreepNumber) continue;
      const taskId = `generate_${role}`;
      if (this.taskMap.hasTask(taskId)) {
        const curTask = this.taskMap.get(taskId);
        this.taskMap.updateTask(taskId, {
          payload: { ...curTask?.payload, number: flagRoleCreepNumber - curRoleCreepNum },
        });
      } else {
        let strategyLevel = room.controller?.level ?? 0;
        if (!room.controller?.my && roomFlag.memory.type === 'sourceRoom') {
          const { mainRoom: mainRoomName } = roomFlag.memory.payload as RemoteSourceRoomPayload;
          if (!mainRoomName) continue;
          strategyLevel = Game.rooms[mainRoomName]?.controller?.level ?? 0;
        }

        const strategy = getStrategy(strategyLevel);
        const bodyArr = strategy.roleMonitor[role]?.body || [];

        // 发布任务
        const task: Task<'generating'> = {
          id: taskId,
          type: 'generating',
          publisherType: room.controller.structureType,
          publisher: room.controller.id,
          toId: room.controller.id,
          allowedCreepRoles: [],
          payload: {
            body: bodyArr,
            number: flagRoleCreepNumber - curRoleCreepNum,
            role,
            memoryRoleOpts: {
              role,
              targetRoom: !room.controller?.my ? room.name : '',
              bornRoom: room.name,
            },
          },
          timestamp: Game.time,
          status: TaskStatusEnum.published,
          room: room.name,
          assignedTo: [],
          needCreepCount: 1,
        };
        this.taskMap.publish(task);
      }
    }
  }
}
