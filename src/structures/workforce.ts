// src/structures/workforce.ts
import { Guild } from '../core/Guild';
import { buildDedupKey } from '../core/Event';
import { getStrategyConfig } from '../strategy/index';

export function runWorkforceLifecycle(room: Room): void {
  const level = room.controller?.level || 1;
  const config = getStrategyConfig(level);

  const roleCounts: Record<string, number> = {};
  for (const name in Game.creeps) {
    const role = Memory.creeps[name]?.role;
    const live = (Game.creeps[name]?.ticksToLive ?? 0) >= 100;
    if (role && live) roleCounts[role] = (roleCounts[role] || 0) + 1;
  }

  for (const role of config.roles) {
    const dedupKey = buildDedupKey('spawn_req', room.name, role.type);
    const actual = roleCounts[role.type] || 0;
    const shortage = role.target - actual;
    if (shortage > 0) {
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
    } else {
      Guild.cancel(dedupKey);
    }
  }
}
