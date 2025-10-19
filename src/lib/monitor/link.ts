export const linkMonitor = (room: Room) => {
  // 新结构: link 结构为 Partial<Record<RoomStructureType, Array<{ id: string; type: 'source' | 'spawn' | 'controller' }>>>
  const linkArr = room.memory?.structure?.link;
  if (!Array.isArray(linkArr)) return;

  // 收集各类型 link
  const sourceLinks: StructureLink[] = [];
  const spawnLinks: StructureLink[] = [];
  const controllerLinks: StructureLink[] = [];

  for (const linkInfo of linkArr) {
    if (!linkInfo || !linkInfo.id || !linkInfo.type) continue;
    const link = Game.getObjectById<StructureLink>(linkInfo.id);
    if (!link) continue;
    if (linkInfo.type === 'source') {
      sourceLinks.push(link);
    } else if (linkInfo.type === 'spawn') {
      spawnLinks.push(link);
    } else if (linkInfo.type === 'controller') {
      controllerLinks.push(link);
    }
  }

  for (const sourceLink of sourceLinks) {
    // link 必须冷却为0且能量满
    if (sourceLink.cooldown === 0 && sourceLink.store[RESOURCE_ENERGY]) {
      // targetLink 因为有能量损耗，所以不可能满，最高799
      const targetLink =
        spawnLinks.find((link) => link.store.getFreeCapacity(RESOURCE_ENERGY) > 1) ||
        controllerLinks.find((link) => link.store.getFreeCapacity(RESOURCE_ENERGY) > 1);
      if (targetLink) sourceLink.transferEnergy(targetLink);
    }
  }
};
