export const EVENT_TYPES = {
  HARVEST_ENERGY: 'harvest_energy',
  TRANSPORT_ENERGY: 'transport_energy',
  FILL_SPAWN: 'fill_spawn',
  UPGRADE_CONTROLLER: 'upgrade_controller',
  BUILD: 'build',
  REPAIR: 'repair',
  SPAWN_REQ: 'spawn_req',
  CREEP_DIED: 'creep_died',
  WORKER_ARRIVED: 'worker_arrived',
  DEFEND: 'defend',
} as const;

/**
 * Build a deduplication key from event type, room, and target ID.
 */
export function buildDedupKey(type: string, room: string, targetId: string): string {
  return `${type}:${room}:${targetId}`;
}

/**
 * Generate a unique event ID including the current tick.
 */
export function generateEventId(type: string, room: string, targetId: string): string {
  return `${type}:${room}:${targetId}:${Game.time}`;
}
