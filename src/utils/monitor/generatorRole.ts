import { ROOM_ID_ENUM } from '@/constant';
import { getStrategy } from '@/strategy';
import { intervalSleep } from '..';
import { role2 } from '../lib/role2';

export const generatorRole = () => {
  creeps();
};

const creeps = () => {
  const creepCounter = new Map<CustomRoleType, number>([
    ['miner', 0],
    ['harvester', 0],
    ['minerStore', 0],
    ['builder', 0],
    ['upgrader', 0],
    ['repairer', 0],
  ]);

  for (let name in Game.creeps) {
    const creep = Game.creeps[name];
    // 只计数主房间的
    if (creep.room.name !== ROOM_ID_ENUM.MainRoom) continue;
    if (creep.memory.role && !creep.name.startsWith('Min')) {
      creepCounter.set(creep.memory.role, (creepCounter.get(creep.memory.role) ?? 0) + 1);
    }
  }

  const strategy = getStrategy(Game.rooms[ROOM_ID_ENUM.MainRoom].controller?.level ?? 0);
  // 根据creepCounterMap创建creep
  const entries = creepCounter.entries();
  for (let [role, count] of entries) {
    if (!strategy.roleMonitor[role]) continue;
    if (count < strategy.roleMonitor[role].count) {
      intervalSleep(10, () => {
        const bodyArr = strategy.roleMonitor[role]?.body || [];
        const bodyCount: Record<string, number> = {};
        for (const part of bodyArr) {
          bodyCount[part] = (bodyCount[part] || 0) + 1;
        }
        console.log(
          `${role} 现有:${count} 需要:${strategy.roleMonitor[role]?.count ?? 0} Body:${JSON.stringify(bodyCount)}`
        );
      });
      role2[role]?.create({ body: strategy.roleMonitor[role].body });
      break;
    }
  }
};
