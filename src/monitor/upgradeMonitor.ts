import { Guild } from '../core/Guild';

export function upgradeMonitor(room: Room): void {
  if (!room.controller || !room.controller.my) return;
  if (room.controller.level >= 8) return;

  const progressRatio = room.controller.progress / room.controller.progressTotal;
  const priority = 30 + Math.floor(progressRatio * 40);
  const maxWorkers = 5;

  Guild.post({
    type: 'upgrade_controller',
    room: room.name,
    targetId: room.controller.id,
    requiredTags: ['work', 'move'],
    requiredCapacities: { work: 1 },
    priority,
    maxWorkers,
    data: { targetId: room.controller.id },
  });
}
