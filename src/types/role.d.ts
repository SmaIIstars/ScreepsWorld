declare global {
  type CustomRoleType =
    | 'harvester'
    | 'builder'
    | 'upgrader'
    | 'miner'
    | 'repairer'
    | 'pioneer'
    | 'claimer'
    | 'remoteHarvester'
    | 'remoteHauler';

  type TaskType =
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
