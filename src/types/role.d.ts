declare global {
  type CustomRoleType = 'harvester' | 'builder' | 'upgrader' | 'miner' | 'minerStore' | 'repairer';

  type CustomRoleTaskType =
    | 'harvesting'
    | 'mining'
    | 'building'
    | 'transferring'
    | 'moving'
    | 'upgrading'
    | 'repairing'
    | 'idle';
}

export {};
