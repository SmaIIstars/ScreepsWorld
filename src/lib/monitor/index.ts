/**
 * 监视器主入口，检测房间内的情况
 * 用于监控房间内的爬虫数量、能量、建筑等信息
 * 每种事件单独隔离
 */

// 主监控入口
function monitorMain(): void {
  for (const roomName in Game.rooms) {
    const room = Game.rooms[roomName];
    if (!room.controller || !room.controller.my) continue;

    monitorEnergy(room);
    monitorCreeps(room);
    monitorStructures(room);
  }
}

// 能量监控
function monitorEnergy(room: Room): void {
  const energyAvailable = room.energyAvailable;
  const energyCapacity = room.energyCapacityAvailable;
  console.log(`[监控][能量] 房间: ${room.name} 能量: ${energyAvailable}/${energyCapacity}`);
}

// 爬虫数量监控
function monitorCreeps(room: Room): void {
  const creepsInRoom = Object.values(Game.creeps).filter((creep) => creep.room.name === room.name);
  const creepRoles: Record<string, number> = {};
  for (const creep of creepsInRoom) {
    const role = creep.memory.role || 'unknown';
    creepRoles[role] = (creepRoles[role] || 0) + 1;
  }
  console.log(`[监控][爬虫] 房间: ${room.name} 爬虫总数: ${creepsInRoom.length}`);
  for (const [role, count] of Object.entries(creepRoles)) {
    console.log(`  - ${role}: ${count}`);
  }
}

// 建筑监控
function monitorStructures(room: Room): void {
  const spawns = room.find(FIND_MY_SPAWNS);
  const towers = room.find(FIND_MY_STRUCTURES, { filter: (s) => s.structureType === STRUCTURE_TOWER });
  console.log(`[监控][建筑] 房间: ${room.name} 孵化器: ${spawns.length} 塔: ${towers.length}`);
}

export default monitorMain;
