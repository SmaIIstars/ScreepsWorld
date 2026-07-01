// constructionMonitor.ts
import { Guild } from '../core/Guild';

export function constructionMonitor(room: Room): void {
  const sites = room.find(FIND_MY_CONSTRUCTION_SITES);
  for (const site of sites) {
    const priorityByType: Record<string, number> = {
      spawn: 80, extension: 75, storage: 70, tower: 65,
      container: 55, road: 40, rampart: 35, wall: 20,
    };
    const basePrio = priorityByType[site.structureType] || 50;
    const progressRatio = site.progress / site.progressTotal;
    const priority = basePrio + Math.floor(progressRatio * 20);

    Guild.post({
      type: 'build',
      room: room.name,
      targetId: site.id,
      requiredTags: ['work', 'move'],
      requiredCapacities: { work: 1 },
      priority,
      maxWorkers: 3,
      data: { targetId: site.id, structureType: site.structureType },
    });
  }
}
