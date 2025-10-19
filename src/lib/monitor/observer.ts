export const observerMonitor = (room: Room) => {
  const observers: StructureObserver[] = [];
  const ids = room.memory?.structure?.[STRUCTURE_OBSERVER] || [];
  for (const id of ids) {
    const observer = Game.getObjectById<StructureObserver>(id);
    if (observer) observers.push(observer);
  }
  if (observers.length === 0) return;

  // 收集所有 flags 指向的房间名
  const targetRoomNames: string[] = [];
  for (const flag of Object.values(Game.flags)) {
    const roomName = flag.pos.roomName;
    // 仅对不可见房间进行观察
    if (!Game.rooms[roomName]) targetRoomNames.push(roomName);
  }
  if (targetRoomNames.length === 0) return;

  // 为每个 observer 分配一个要观察的房间（时间片轮转）
  for (let i = 0; i < observers.length; i++) {
    if (!targetRoomNames[i]) return;
    const observer = observers[i];
    const roomName = targetRoomNames[i];
    observer?.observeRoom(roomName);
  }
};
