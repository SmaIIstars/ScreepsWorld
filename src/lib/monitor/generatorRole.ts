import { ROOM_ID_ENUM } from '@/constant';
import { getStrategy } from '@/strategy';
import { intervalSleep } from '@/utils';

export const generatorRole = (room: Room) => {
  if (room.name !== ROOM_ID_ENUM.MainRoom) return;
  const strategy = getStrategy(room.controller?.level ?? 0);
  const creepCounter = room.memory?.creepsCount;
  if (!creepCounter) return;

  const roles = Object.keys(strategy.roleMonitor) as CustomRoleType[];
  for (const role of roles) {
    // 写死
    if (role === 'remoteMiner') {
      const flagCount = Object.values(Game.flags).filter((flag) => flag.memory.type === 'sourceRoom').length;
      if (creepCounter[role] < flagCount) {
        const bodyArr = strategy.roleMonitor[role]?.body || [];
        const bodyCount: Record<string, number> = {};
        for (const part of bodyArr) {
          bodyCount[part] = (bodyCount[part] || 0) + 1;
        }
      }
      continue;
    }

    if (!strategy.roleMonitor[role]) continue;
    if (creepCounter[role] < strategy.roleMonitor[role].count) {
      intervalSleep(10, () => {
        const bodyArr = strategy.roleMonitor[role]?.body || [];
        const bodyCount: Record<string, number> = {};
        for (const part of bodyArr) {
          bodyCount[part] = (bodyCount[part] || 0) + 1;
        }
        console.log(
          `${role} 现有:${creepCounter[role]} 需要:${strategy.roleMonitor[role]?.count ?? 0} Body:${JSON.stringify(
            bodyCount
          )}`
        );
      });

      const base = Object.values(Game.spawns).find((spawn) => spawn.room.name === room.name && !spawn.spawning);
      if (base) {
        const resp = utils.roles[role]?.create(base, { body: strategy.roleMonitor[role].body });
        if (resp === OK) {
          creepCounter[role] += 1;
          room.memory.creepsCount = creepCounter;
        }
      }
      break;
    }
  }
};
