import { BaseStructure } from './BaseStructure';
import { Guild } from '../core/Guild';

export class TowerLifecycle extends BaseStructure<StructureTower> {
  runLifecycle(): void {
    const tower = this.obj;
    const room = this.room;

    // ── 1. Energy: post fill if not full ──
    const freeCap = tower.store.getFreeCapacity(RESOURCE_ENERGY);
    if (freeCap > 0) {
      this.post({
        type: 'fill',
        room: room.name,
        targetId: tower.id,
        requiredTags: ['transport', 'move'],
        requiredCapacities: { carry: 50 },
        priority: 70,
        maxWorkers: 1,
        quota: { resourceType: RESOURCE_ENERGY, amount: freeCap },
        data: { targetId: tower.id },
      });
    } else {
      this.cancel('fill');
    }

    // ── 2. Health: post repair if damaged ──
    if (tower.hits < tower.hitsMax) {
      this.post({
        type: 'repair',
        room: room.name,
        targetId: tower.id,
        requiredTags: ['work', 'move'],
        requiredCapacities: { work: 1, carry: 50 },
        priority: 65,
        maxWorkers: 1,
        quota: { resourceType: RESOURCE_ENERGY, amount: tower.hitsMax - tower.hits },
        data: { targetId: tower.id },
      });
    } else {
      this.cancel('repair');
    }

    // ── 3. Combat ──
    const hostiles = room.find(FIND_HOSTILE_CREEPS);
    if (hostiles.length > 0) {
      const target = tower.pos.findClosestByRange(hostiles)!;
      tower.attack(target);

      Guild.post({
        type: 'defend',
        room: room.name,
        targetId: room.name,
        requiredTags: ['attack', 'move'],
        requiredCapacities: { attack: 30 },
        priority: 90,
        maxWorkers: 3,
        data: { roomName: room.name, pos: { x: target.pos.x, y: target.pos.y, roomName: room.name } },
      });
      return;
    }

    this.cancel('defend');

    // ── 4. Heal friendly creeps ──
    const damagedCreeps = room.find(FIND_MY_CREEPS).filter(
      (c) => c.hits < c.hitsMax
    );
    if (damagedCreeps.length > 0) {
      const target = damagedCreeps.sort((a, b) => a.hits - b.hits)[0];
      tower.heal(target);
    }
  }
}
