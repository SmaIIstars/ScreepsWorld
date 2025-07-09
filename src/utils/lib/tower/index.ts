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
    this.healFriendlyCreeps();
    // 然后治疗友军
    this.attackHostileCreeps();
    // 最后修复建筑
    this.repairStructures();
  }

  /**
   * 攻击敌人
   */
  private attackHostileCreeps(): void {
    const hostileCreeps = this.tower.room.find(FIND_HOSTILE_CREEPS, {
      filter: (creep) => {
        // 过滤掉没有攻击能力的敌人
        return creep.body.some((part) => part.type === ATTACK || part.type === RANGED_ATTACK);
      },
    });

    if (hostileCreeps.length > 0) {
      // 优先攻击生命值最低的敌人
      const targetCreep = hostileCreeps.sort((a, b) => a.hits - a.hitsMax)[0];
      this.tower.attack(targetCreep);
    }
  }

  /**
   * 治疗友军
   */
  private healFriendlyCreeps(): void {
    const damagedCreeps = this.tower.room.find(FIND_MY_CREEPS, {
      filter: (creep) => creep.hits < creep.hitsMax,
    });

    if (damagedCreeps.length > 0) {
      // 优先治疗生命值最低的友军
      const targetCreep = damagedCreeps.sort((a, b) => a.hits - b.hits)[0];
      this.tower.heal(targetCreep);
    }
  }

  /**
   * 修复建筑
   */
  private repairStructures(): void {
    const structures = this.tower.room.find(FIND_STRUCTURES, {
      filter: (structure) => {
        // 全部的Road都修复
        if (structure instanceof StructureRoad) return true;
        // 全部的Container都修复
        if (structure instanceof StructureContainer) return true;
        // 附近6格的Wall都修复
        if (structure instanceof StructureWall && this.tower.pos.getRangeTo(structure) <= 6) return true;
        // 其他建筑，修复到100000
        return structure.hits < structure.hitsMax && structure.hits < 100000;
      },
    });

    // const structures = this.tower.pos.findInRange(FIND_STRUCTURES, 6, {
    //   filter: (structure) =>
    //     structure instanceof StructureRoad || (structure.hits < structure.hitsMax && structure.hits < 100000),
    // });

    if (structures.length > 0) {
      const targetStructure = structures.sort((a, b) => a.hits - b.hits)[0];
      this.tower.repair(targetStructure);
    }
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
