import { BaseStructure } from './BaseStructure';
import { Guild } from '../core/Guild';

export class SourceLifecycle extends BaseStructure<Source> {
  runLifecycle(): void {
    if (this.obj.energy > 0) {
      const assignments = Memory.rooms[this.room.name]?.minerAssignments;
      const minerName = assignments?.[this.obj.id as unknown as string];

      if (minerName && Game.creeps[minerName]) {
        // Source has a bound miner → auto-assign harvest directly
        const miner = Game.creeps[minerName];
        const event = Guild.post({
          type: 'harvest',
          room: this.room.name,
          targetId: this.obj.id,
          requiredTags: ['harvest', 'move'],
          requiredCapacities: { harvest: 1 },
          priority: 80,
          publisherType: 'source',
          data: { targetId: this.obj.id, quota: { [RESOURCE_ENERGY]: this.obj.energy } },
        });
        Guild.claim(event.id, minerName, miner.store.getFreeCapacity(RESOURCE_ENERGY));
        miner.memory.currentEventId = event.id;
      } else {
        // Clean up dead miner assignment
        if (minerName && assignments) {
          delete assignments[this.obj.id as unknown as string];
        }

        // Open harvest for any harvester
        this.post({
          type: 'harvest',
          room: this.room.name,
          targetId: this.obj.id,
          requiredTags: ['harvest', 'move'],
          requiredCapacities: { harvest: 1 },
          priority: 80,
          publisherType: 'source',
          data: { targetId: this.obj.id, quota: { [RESOURCE_ENERGY]: this.obj.energy } },
        });
      }
    } else {
      this.cancel('harvest');
    }
  }
}
