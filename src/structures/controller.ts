// src/structures/controller.ts
import { BaseStructure } from './BaseStructure';

export class ControllerLifecycle extends BaseStructure<StructureController> {
  runLifecycle(): void {
    if (!this.obj.my) {
      this.cancel('upgrade');
      return;
    }
    if (this.obj.level >= 8) {
      this.cancel('upgrade');
      return;
    }
    const progressRatio = this.obj.progress / this.obj.progressTotal;
    const priority = 30 + Math.floor(progressRatio * 40);
    this.post({
      type: 'upgrade',
      room: this.room.name,
      targetId: this.obj.id,
      requiredTags: ['work', 'move'],
      requiredCapacities: { work: 1 },
      priority,
      maxWorkers: 99,
      data: { targetId: this.obj.id },
    });
  }
}
