// workforceMonitor.ts
// Monitors creep population and publishes spawn_req events when below target
import { EventBus } from '../core/EventBus';
const DEFAULT_CONFIG: LevelConfig = {
  level: 1,
  roles: [
    {
      type: 'harvester',
      body: [WORK, WORK, CARRY, MOVE],
      tags: ['harvest', 'transport', 'move'],
      minCapacities: { harvest: 1, carry: 50 },
      target: 2,
    },
    {
      type: 'upgrader',
      body: [WORK, CARRY, MOVE],
      tags: ['work', 'transport', 'move'],
      minCapacities: { work: 1, carry: 50 },
      target: 1,
    },
  ],
};
export function workforceMonitor(room: Room): void {
  const config = DEFAULT_CONFIG;
  // Count living creeps by rolePref
  const roleCounts: Record<string, number> = {};
  for (const name in Game.creeps) {
    const role = Memory.creeps[name]?.role;
    if (role) roleCounts[role] = (roleCounts[role] || 0) + 1;
  }
  // Compare with targets and publish spawn_req for shortages
  for (const role of config.roles) {
    const actual = roleCounts[role.type] || 0;
    const shortage = role.target - actual;
    if (shortage <= 0) continue;
    EventBus.publish({
      type: 'spawn_req',
      room: room.name,
      targetId: role.type, // role name as targetId for dedup
      requiredTags: ['spawner'],
      priority: shortage * 20 + 50,
      ttl: 50,
      data: {
        role: role.type,
        body: role.body,
        tags: role.tags,
        minCapacities: role.minCapacities,
        count: shortage,
      },
    });
  }
}