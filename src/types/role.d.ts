declare global {
  type CustomRoleType =
    | 'harvester'
    | 'builder'
    | 'upgrader'
    | 'miner'
    | 'repairer'
    | 'pioneer'
    | 'claimer'
    | 'remoteMiner'
    | 'remoteHarvester'
    | 'pioneer';

  type TaskType =
    | 'harvesting'
    | 'mining'
    | 'building'
    | 'transferring'
    | 'moving'
    | 'upgrading'
    | 'repairing'
    | 'pioneering'
    | 'claiming'
    | 'scouting';
}

export {};
