/**
 * 炮塔管理类
 */
export class TowerManager {
  private tower: StructureTower;

  constructor(tower: StructureTower) {
    this.tower = tower;
  }

  /**
   * 执行炮塔逻辑
   */
  run(): void {
    // 如果炮塔没有能量，不执行任何操作
    if (this.tower.store[RESOURCE_ENERGY] === 0) {
      return;
    }

    // 优先攻击敌人
    if (this.attackHostileCreeps()) {
      return;
    }
    // 然后治疗友军;
    if (this.healFriendlyCreeps()) {
      return;
    }

    // 最后修复建筑
    if (this.tower.store[RESOURCE_ENERGY] > (this.tower.store.getCapacity(RESOURCE_ENERGY) ?? 0) * 0.6) {
      this.repairStructures();
    }
  }

  /**
   * 攻击敌人
   */
  private attackHostileCreeps(): boolean {
    const hostileCreeps = this.tower.room.find(FIND_HOSTILE_CREEPS, {
      filter: (creep) => {
        return creep.body.some((part) => part.type === ATTACK || part.type === RANGED_ATTACK);
      },
    });

    if (hostileCreeps.length > 0) {
      // 优先攻击生命值最低的敌人
      const targetCreep = hostileCreeps.sort((a, b) => a.hits - a.hitsMax)[0];
      this.tower.attack(targetCreep);
      return true;
    }
    return false;
  }

  /**
   * 治疗友军
   */
  private healFriendlyCreeps(): boolean {
    const damagedCreeps = this.tower.room.find(FIND_MY_CREEPS, {
      filter: (creep) => creep.hits < creep.hitsMax,
    });

    if (damagedCreeps.length > 0) {
      // 优先治疗生命值最低的友军
      const targetCreep = damagedCreeps.sort((a, b) => a.hits - b.hits)[0];
      this.tower.heal(targetCreep);
      return true;
    }
    return false;
  }

  /**
   * 修复建筑
   */
  private repairStructures(): boolean {
    const structures = this.tower.room.find(FIND_STRUCTURES, {
      filter: (structure) => {
        if (structure.hits === structure.hitsMax) return false;
        // 全部的Road都修复
        if (structure instanceof StructureRoad && structure.hits < structure.hitsMax * 0.6) return true;
        // 全部的Container都修复
        if (structure instanceof StructureContainer && structure.hits < structure.hitsMax * 0.6) return true;
        // 全部的Rampart都修复
        if (structure instanceof StructureRampart && structure.hits < structure.hitsMax * 0.05) return true;
        // 附近6格的Wall都修复
        if (
          structure instanceof StructureWall &&
          // this.tower.pos.getRangeTo(structure) <= 6 &&
          structure.hits < structure.hitsMax * 0.0005
        )
          return true;
        // 其他建筑，修复到100000
        return structure.hits < 100000;
      },
    });

    if (structures.length > 0) {
      const targetStructure = structures.sort((a, b) => {
        // 优先修复road
        if (a instanceof StructureRoad) return -1;
        if (b instanceof StructureRoad) return 1;
        // 然后修复Container
        if (a instanceof StructureContainer) return -1;
        if (b instanceof StructureContainer) return 1;
        // 然后修复Rampart
        if (a instanceof StructureRampart) return -1;
        if (b instanceof StructureRampart) return 1;
        // 最后修复其他建筑
        return a.hits - b.hits;
      })[0];

      this.tower.repair(targetStructure);
      return true;
    }
    return false;
  }
}

/**
 * 运行所有炮塔
 */
export const runTowers = (room: Room): void => {
  const towers = room.find(FIND_MY_STRUCTURES, {
    filter: (structure): structure is StructureTower => structure.structureType === STRUCTURE_TOWER,
  });

  towers.forEach((tower) => {
    const towerManager = new TowerManager(tower);
    towerManager.run();
  });
};
