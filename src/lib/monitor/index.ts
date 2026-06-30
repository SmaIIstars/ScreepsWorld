import { generatorRoleBody, intervalSleep } from '@/utils';
import { Task, TaskMap, TaskStatusEnum } from '../utils/taskMap';
import { flagMonitor } from './flagMemory';
import { linkMonitor } from './link';
import { observerMonitor } from './observer';
import { roomMemory } from './roomMemory';
import { tempScriptTask } from './tempTask';

export const gameMonitor = () => {
  tempScriptTask();
  intervalSleep(10, flagMonitor);
  generatePixel();
};

export const roomMonitor = (room: Room) => {
  roomMemory(room);
  observerMonitor(room);
  runSpawnGeneratingTasks(room);
  linkMonitor(room);
  // generatorRoleAttacker(room);
  returnNonRemoteCreepsToMainRoom(room);
  factoryWorkerTask(room);
  powerSpawnTask(room);
};

// pixel
const generatePixel = () => {
  if (Game.cpu.bucket >= 10000) {
    const result = Game.cpu.generatePixel();

    if (result === OK) {
      console.log('生成 1 pixel', result);
    } else {
      console.log('生成 pixel 失败', result);
    }
  }
};

/**
 * 非remote creep需要回到最近的 main 房间
 * For non-remote creeps that are not in a main room, direct them to return to the nearest main room.
 */
export const returnNonRemoteCreepsToMainRoom = (room: Room) => {
  if (room.controller?.my) return;
  const creeps = room.find(FIND_MY_CREEPS);
  for (const creep of creeps) {
    if (creep.memory.role?.startsWith('remote') && creep.hits === creep.hitsMax) continue;
    if (creep.memory.role === 'attacker') continue;
    if (creep.memory.role === 'claimer') continue;
    const mainRooms: Room[] = Object.values(Game.rooms).filter((r) => r.controller?.my);
    let closestRoom: Room | undefined;
    let minDist = Infinity;
    for (const room of mainRooms) {
      // Use RoomPosition.getRangeTo for a rough estimate (center to center)
      const dist = Game.map.getRoomLinearDistance(creep.room.name, room.name);
      if (dist < minDist) {
        minDist = dist;
        closestRoom = room;
      }
    }

    if (closestRoom) {
      const targetPos = new RoomPosition(25, 25, closestRoom.name);
      if (!creep.pos.isEqualTo(targetPos)) {
        creep.moveTo(targetPos, { visualizePathStyle: { stroke: '#ffaa00' } });
      }
    }
  }
};

/**
 * Make available Spawns take and act on generating tasks from the current task system.
 * (Assumes task system is already initialized and attached to room/global.)
 */
const generatePriorityRole: CustomRoleType[] = ['miner', 'harvester', 'upgrader'];
const rolePriorityMap = new Map(generatePriorityRole.map((role, idx) => [role, idx]));
export const runSpawnGeneratingTasks = (room: Room) => {
  let spawns = room.find(FIND_MY_SPAWNS, { filter: (spawn) => !spawn.spawning });
  const flagMemory = Memory.flags[room.name];
  if (!room.controller?.my && flagMemory?.type === 'sourceRoom' && flagMemory.status === 'active') {
    const { mainRoom: mainRoomName } = flagMemory.payload as RemoteSourceRoomPayload;
    if (!mainRoomName) return;
    const mainRoomTaskMap = new TaskMap(mainRoomName);
    // if mainRoom still have generate task, don't care the sourceRoom
    if (mainRoomTaskMap.getAll().some((t) => t.id.startsWith('generate'))) return;
    spawns = Game.rooms[mainRoomName].find(FIND_MY_SPAWNS, { filter: (spawn) => !spawn.spawning });
  }
  if (!spawns.length) return;
  for (const spawn of spawns) {
    const taskMap = new TaskMap(room.name);
    if (!taskMap) return;
    const generatingTasks = taskMap.taskPriorityQueue('generating', {
      filter: (task) => {
        if (task.type !== 'generating') return false;
        const { role, body, number } = (task as Task<'generating'>).payload ?? {};
        if (!role || !body?.length || (number ?? 0) <= 0) {
          taskMap.updateTask(task.id, { status: TaskStatusEnum.completed });
          return false;
        }

        return true;
      },
    }) as Task<'generating'>[];

    generatingTasks.sort((a, b) => {
      const roleA = a.payload?.role;
      const roleB = b.payload?.role;
      const priA = roleA && rolePriorityMap.has(roleA) ? rolePriorityMap.get(roleA)! : 999;
      const priB = roleB && rolePriorityMap.has(roleB) ? rolePriorityMap.get(roleB)! : 999;
      if (priA !== priB) {
        return priA - priB; // 优先级小的在前
      }
      // 若优先级一样，按时间戳升序
      return (a.timestamp ?? 0) - (b.timestamp ?? 0);
    });
    if (!generatingTasks.length) return;

    const generatingTask = generatingTasks[0];
    if (!generatingTask) continue;
    // if (room.name === 'E13N15') {
    //   console.log(room.name, JSON.stringify(generatingTask));
    // }
    const { payload } = generatingTask;
    const { role, body, memoryRoleOpts, number } = payload ?? {};
    // console.log(role, body?.length, generatingTask.id, JSON.stringify(payload));
    if (!role || !body) continue;
    // console.log(JSON.stringify(spawn.name));
    if (!number) {
      taskMap.updateTask(generatingTask.id, { status: TaskStatusEnum.completed });
      generatingTasks.shift();
      continue;
    }

    const name = `${role}_${Game.time}`;

    const resp = utils.roles[role]?.create(spawn, { name, body, memoryRoleOpts });
    if (resp === OK) {
      console.log(`[${room.name}] GenerateTask Successful(${spawn.name}): `, generatingTask.id);
      if (number <= 1) generatingTasks.shift();
      taskMap.updateTask(generatingTask.id, {
        payload: {
          ...payload,
          number: number - 1,
          status: number <= 1 ? TaskStatusEnum.completed : TaskStatusEnum.inProgress,
        },
      });
    }
  }
};

const factoryWorkerTask = (room: Room) => {
  const PRODUCE_ENERGY = 1000;
  const SOURCE_PRODUCE_NUMBER = 500;

  const flagMemory = Game.flags[room.name];
  if (!flagMemory || flagMemory?.memory?.type !== 'mainRoom') return;
  if (!(flagMemory.memory.payload as MainRoomPayload).factory) return;
  const roomMemory = global.rooms[room.name];
  const {
    run,
    energyThreshold = 200000,
    creepPosition,
    sourceStructureType,
    targetStructureType = sourceStructureType,
    sourceType,
    targetType,
    sourceThreshold = PRODUCE_ENERGY,
  } = (flagMemory.memory.payload as MainRoomPayload).factory;
  if (!run) return;
  if (!sourceType || !targetType) return;
  const factoryId = roomMemory.structure?.[STRUCTURE_FACTORY];
  const sourceStructureId = roomMemory.structure?.[sourceStructureType];
  const targetStructureId = roomMemory.structure?.[targetStructureType];
  if (!factoryId || !sourceStructureId || !targetStructureId) return;
  const factory = Game.getObjectById<StructureFactory>(factoryId);
  const sourceStructure = Game.getObjectById<StructureStorage>(sourceStructureId);
  const targetStructure = Game.getObjectById<StructureStorage>(targetStructureId);
  if (!sourceStructure || !targetStructure || !factory) return;
  if (sourceStructure.store[RESOURCE_ENERGY] <= energyThreshold) return;
  if (!factory.cooldown && factory.store.energy >= PRODUCE_ENERGY && factory.store[sourceType] >= SOURCE_PRODUCE_NUMBER)
    factory.produce(targetType);
  const creepName = `${room.name}-transfer`;
  const creep = Game.creeps[creepName];
  if (!creep) {
    const spawn = room.find(FIND_MY_SPAWNS, { filter: (spawn) => !spawn.spawning })[0];
    if (!spawn) return;
    spawn.spawnCreep(
      generatorRoleBody([
        { body: MOVE, count: 1 },
        { body: CARRY, count: 10 },
      ]),
      creepName
    );
    return;
  }
  const [x, y] = creepPosition.split(',').map((i) => Number(i));
  if (!creep.pos.isEqualTo(x, y)) {
    creep.moveTo(x, y);
    return;
  }

  if (creep.store.getUsedCapacity()) {
    if (creep.store[sourceType]) creep.transfer(factory, sourceType);
    else if (creep.store[targetType]) creep.transfer(targetStructure, targetType);
    else {
      const resources = Object.keys(creep.store) as ResourceConstant[];
      for (const resource of resources) creep.transfer(sourceStructure, resource);
    }
  }

  if (factory.store[RESOURCE_ENERGY] < PRODUCE_ENERGY) {
    if (targetStructure.store[RESOURCE_ENERGY]) creep.withdraw(targetStructure, RESOURCE_ENERGY);
    else creep.withdraw(sourceStructure, RESOURCE_ENERGY);
    creep.transfer(factory, RESOURCE_ENERGY);
  }
  if (factory.store[targetType]) {
    creep.withdraw(factory, targetType);
  }
  if (factory.store[sourceType] < sourceThreshold) {
    if (targetStructure.store[sourceType]) creep.withdraw(targetStructure, sourceType);
    else creep.withdraw(sourceStructure, sourceType);
  }
};

const powerSpawnTask = (room: Room) => {
  const powerSpawn = room.find(FIND_MY_STRUCTURES, { filter: (s) => s.structureType === STRUCTURE_POWER_SPAWN })[0];
  if (!powerSpawn) return;
  if (powerSpawn.store[RESOURCE_POWER]) powerSpawn.processPower();
};
