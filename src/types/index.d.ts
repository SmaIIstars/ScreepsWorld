declare global {
  // lodash is globally available in Screeps environment
  const _: any;
  var utils: {};

  var rooms: Record<string, RoomMemory>;
}
export {};
