// Memory 被JSON序列化，不能缓存 Function

import { BASE_ID_ENUM } from '@/constant';
import { intervalSleep } from '..';
import { generatorRoleBody } from '../lib/base/role';
import { generatorRole } from './generatorRole';

const MIN_MINER_LIST = ['MinMiner', 'MinMiner2'];

const task = () => {
  if (!minCreepGroup()) return;
  miner();
  generatorRole();
};

// 最小角色组，用于兜底
const minCreepGroup = (): boolean => {
  const minCreepsList: Array<{ name: string; role: CustomRoleType }> = [
    ...MIN_MINER_LIST.map<{ name: string; role: CustomRoleType }>((name) => ({ name, role: 'miner' })),
    { name: 'MinHarvester', role: 'harvester' },
    { name: 'MinHarvester2', role: 'harvester' },
    { name: 'MinUpgrader', role: 'upgrader' },
    { name: 'MinBuilder', role: 'builder' },
  ];

  for (const creep of minCreepsList) {
    if (creep.name.startsWith('MinMiner') && Memory.creepsCount.miner >= 2) continue;
    const minCreep = Game.creeps[creep.name];
    if (!minCreep) {
      let body = [];
      switch (creep.role) {
        case 'miner': {
          body = generatorRoleBody([
            { body: WORK, count: 2 },
            { body: CARRY, count: 1 },
            { body: MOVE, count: 1 },
          ]);
          break;
        }
        default: {
          body = generatorRoleBody([
            { body: WORK, count: 1 },
            { body: CARRY, count: 2 },
            { body: MOVE, count: 2 },
          ]);
          break;
        }
      }

      const spawnResult = Game.spawns[BASE_ID_ENUM.MainBase].spawnCreep(body, creep.name, {
        memory: { role: creep.role, task: creep.role === 'miner' ? 'moving' : 'harvesting' },
      });

      switch (spawnResult) {
        case OK: {
          console.log(`MiniGroup 孵化${creep.name}成功`);
          break;
        }
        case ERR_NOT_ENOUGH_ENERGY: {
          intervalSleep(5, () => console.log(`MiniGroup 缺少${creep.name}, 能量不足, 等待孵化`));
          break;
        }
        case ERR_NOT_ENOUGH_RESOURCES: {
          intervalSleep(5, () => console.log(`MiniGroup 缺少${creep.name}, 资源不足, 等待孵化`));
          break;
        }
        default:
          break;
      }

      return false;
    }
  }

  return true;
};

const miner = () => {
  if (!Memory.creepsCount.miner) return;
  // 已有miner多少个, 则杀死几个小MinMiner
  let killed = 0;
  for (const name in Game.creeps) {
    if (killed >= Memory.creepsCount.miner) break;
    if (name.startsWith('MinMiner')) {
      Game.creeps[name].suicide();
      Game.creeps[name].say('退役');
      killed++;
    }
  }
};

export { task };
