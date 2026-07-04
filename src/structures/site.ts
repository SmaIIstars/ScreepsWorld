// src/structures/site.ts
import { BaseStructure } from './BaseStructure';

export class SiteLifecycle extends BaseStructure<ConstructionSite> {
  runLifecycle(): void {
    const priorityByType: Record<string, number> = {
      spawn: 80, extension: 75, storage: 70, tower: 65,
      container: 55, road: 40, rampart: 35, wall: 20,
    };
    const basePrio = priorityByType[this.obj.structureType] || 50;
    const progressRatio = this.obj.progress / this.obj.progressTotal;
    const priority = basePrio + Math.floor(progressRatio * 20);
    const remaining = this.obj.progressTotal - this.obj.progress;
    this.post({
      type: 'build',
      room: this.room.name,
      targetId: this.obj.id,
      requiredTags: ['work', 'move'],
      requiredCapacities: { work: 1 },
      priority,
      maxWorkers: 3,
      publisherType: 'site',
      data: { targetId: this.obj.id, structureType: this.obj.structureType, quota: { [RESOURCE_ENERGY]: remaining } },
    });
  }
}
