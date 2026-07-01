// workforceMonitor.ts
import { Guild } from '../core/Guild';
import { getStrategyConfig } from '../strategy/index';

export function workforceMonitor(room: Room): void {
  const level = room.controller?.level || 1;
  const config = getStrategyConfig(level);

  const roleCounts: Record<string, number> = {};
  for (const name in Game.creeps) {
    const role = Memory.creeps[name]?.role;
    if (role) roleCounts[role] = (roleCounts[role] || 0) + 1;
  }

  for (const role of config.roles) {
    const actual = roleCounts[role.type] || 0;
    const shortage = role.target - actual;
    if (shortage <= 0) continue;
    Guild.post({
      type: 'spawn_req',
      room: room.name,
      targetId: role.type,
      requiredTags: ['spawner'],
      priority: shortage * 20 + 50,
      data: {
        role: role.type,
        body: role.body,
        tags: role.tags,
        minCapacities: role.minCapacities,
        count: role.target,
      },
    });
  }
}