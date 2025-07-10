declare global {
  type CustomRoleType = 'harvester' | 'builder' | 'upgrader' | 'miner' | 'minerStore' | 'repairer' | 'pioneer';

  type CustomRoleTaskType =
    | 'harvesting'
    | 'mining'
    | 'building'
    | 'transferring'
    | 'moving'
    | 'upgrading'
    | 'repairing'
    | 'pioneering'
    | 'idle';
}

export {};
