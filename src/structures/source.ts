// src/structures/source.ts
import { BaseStructure } from './BaseStructure';

export class SourceLifecycle extends BaseStructure<Source> {
  runLifecycle(): void {
    if (this.obj.energy > 0) {
      this.post({
        type: 'harvest',
        room: this.room.name,
        targetId: this.obj.id,
        requiredTags: ['harvest', 'move'],
        requiredCapacities: { harvest: 1 },
        priority: 80,
        maxWorkers: 3,
        data: { targetId: this.obj.id },
      });
    } else {
      this.cancel('harvest');
    }
  }
}
