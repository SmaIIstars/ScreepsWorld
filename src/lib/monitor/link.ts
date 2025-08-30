/**
 * 管理房间内 link 能量传输：
 * - 从 Memory.rooms[room.name].structure.link 获取所有 link 信息
 * - 当 source link 能量满时，自动传送能量到 spawn link
 */
export const linkMonitor = (room: Room) => {
  // 新结构: link 结构为 Partial<Record<RoomStructureType, Array<{ id: string; type: 'source' | 'spawn' | 'controller' }>>>
  const linkArr = Memory.rooms[room.name]?.structure?.link;
  if (!Array.isArray(linkArr)) return;

  // 收集各类型 link
  const sourceLinks: StructureLink[] = [];
  let spawnLink: StructureLink | undefined = undefined;

  for (const linkInfo of linkArr) {
    if (!linkInfo || !linkInfo.id || !linkInfo.type) continue;
    const link = Game.getObjectById<StructureLink>(linkInfo.id);
    if (!link) continue;
    if (linkInfo.type === 'source') {
      sourceLinks.push(link);
    } else if (linkInfo.type === 'spawn') {
      spawnLink = link;
    }
  }

  // 只处理有 spawn link 的情况
  if (!spawnLink) return;
  for (const sourceLink of sourceLinks) {
    // link 必须冷却为0且能量满
    if (sourceLink.cooldown === 0 && sourceLink.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
      // spawn link 必须有空间
      if (spawnLink.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
        sourceLink.transferEnergy(spawnLink);
      }
    }
  }
};
