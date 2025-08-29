export const attackTarget = (creepName: string, targetId: string) => {
  const creep = Game.creeps[creepName];
  const target = Game.getObjectById(targetId) as AnyCreep | Structure;

  if (!creep) {
    console.log(`[ERR] Creep ${creepName} not found`);
    return ERR_INVALID_TARGET;
  }
  if (!target) {
    console.log(`[ERR] Target with ID ${targetId} not found`);
    return ERR_INVALID_TARGET;
  }

  const attackResult = creep.attack(target);

  if (attackResult === ERR_NOT_IN_RANGE) {
    creep.moveTo(target, {
      visualizePathStyle: { stroke: '#ff0000' }, // 可选：可视化移动路径（红色）
      reusePath: 5, // 可选：优化路径计算，减少CPU消耗
    });
    console.log(`${creepName} is moving to target ${targetId}`);
  } else if (attackResult === OK) {
    console.log(`${creepName} is attacking ${targetId}`);
  } else {
    console.log(`${creepName} attack error: ${attackResult}`);
  }

  return attackResult;
};
