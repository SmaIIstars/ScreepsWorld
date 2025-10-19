export function safeJsonParse<T>(json: string): T | null;
export function safeJsonParse<T>(json: string, defaultValue: T): T;
export function safeJsonParse<T>(json: string, defaultValue?: T): T | null {
  try {
    return JSON.parse(json);
  } catch (error) {
    return defaultValue ?? null;
  }
}

export const drawRoomArray = (roomName: string, roomArray: CostMatrix, color?: string) => {
  const visual = new RoomVisual(roomName);
  for (let x = 0; x < 50; x++) {
    for (let y = 0; y < 50; y++) {
      const value = roomArray.get(x, y);
      visual.text(value.toString(), x, y, { font: 0.5, color: value >= 255 ? '#ff0000' : '#ffffff' });
    }
  }
};

export const isCustomRoleType = (role: string): role is CustomRoleType => {
  return [
    'harvester',
    'builder',
    'upgrader',
    'miner',
    'repairer',
    'pioneer',
    'claimer',
    'remoteMiner',
    'remoteHarvester',
    'attacker',
  ].includes(role);
};
