import { Task, TaskMap, TaskStatusEnum } from '../utils/taskMap';
import { flagMonitor } from './flagMemory';
import { generatorRoleAttacker } from './generatorRole';
import { linkMonitor } from './link';
import { observerMonitor } from './observer';
import { roomMemory } from './roomMemory';
import { tempScriptTask } from './tempTask';

export const gameMonitor = () => {
  tempScriptTask();
  flagMonitor();
  generatePixel();
};

export const roomMonitor = (room: Room) => {
  roomMemory(room);
  observerMonitor(room);
  // generatorRole(room);
  runSpawnGeneratingTasks(room);
  linkMonitor(room);
  generatorRoleAttacker(room);
  // generatorRemoteResourceCreeps(room);
  returnNonRemoteCreepsToMainRoom(room);
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
export const runSpawnGeneratingTasks = (room: Room) => {
  // Only proceed for owned rooms
  if (!room.controller?.my) return;

  // Find all available spawns in this room (not spawning)
  const spawns = room.find(FIND_MY_SPAWNS, {
    filter: (spawn) => !spawn.spawning,
  });

  if (!spawns.length) return;

  // Retrieve the room's task system TaskMap
  const taskMap = new TaskMap(room.name);
  if (!taskMap) return;
  const generatingTask: Task<'generating'> = taskMap.taskPriorityQueue('generating', {
    filter: (task) => {
      if (task.type !== 'generating') return false;
      const { role, body, number } = (task as Task<'generating'>).payload ?? {};
      if (!role || !body?.length || (number ?? 0) <= 0) {
        taskMap.updateTask(task.id, { status: TaskStatusEnum.completed });
        return false;
      }

      return true;
    },
  })?.[0] as Task<'generating'>;

  if (!generatingTask) return;
  for (const spawn of spawns) {
    const { payload } = generatingTask;
    const { role, body, memoryRoleOpts, number } = payload ?? {};
    console.log(role, body?.length, generatingTask.id, JSON.stringify(payload));
    if (!role || !body) continue;
    console.log(JSON.stringify(spawn.name));
    if (!number) {
      taskMap.updateTask(generatingTask.id, { status: TaskStatusEnum.completed });
      continue;
    }
    const name = `${role}_${Game.time}`;

    const resp = utils.roles[role]?.create(spawn, { name, body, memoryRoleOpts });
    if (resp === OK) {
      taskMap.updateTask(generatingTask.id, { payload: { ...payload, number: number - 1 } });
    }
  }
};
