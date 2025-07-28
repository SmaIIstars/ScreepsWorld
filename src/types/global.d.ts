declare global {
  var utils: {
    roles: import('@/lib/role').GlobalRolesType;
  };

  var rooms: Record<string, RoomMemory>;
}
export {};
