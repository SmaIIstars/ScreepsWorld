import { getStrategy } from '@/strategy';
import { intervalSleep } from '@/utils';

export const generatorRole = (room: Room) => {
  const strategy = getStrategy(room.controller?.level ?? 0);
  const creepCounter = room.memory?.creepsCount;
  if (!creepCounter) return;

  const roles = Object.keys(strategy.roleMonitor) as CustomRoleType[];
  for (const role of roles) {
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
      if (base) utils.roles[role]?.create(base, { body: strategy.roleMonitor[role].body });
      break;
    }
  }
};
