import { generatorRoleBody } from '@/utils';
import { StrategyType } from '.';

const strategy: StrategyType = {
  roleMonitor: {
    miner: {
      count: 2,
      body: generatorRoleBody([
        { body: WORK, count: 6 },
        //  { body: CARRY, count: 1 },
        { body: MOVE, count: 3 },
      ]),
    },
    harvester: {
      count: 2,
      body: generatorRoleBody([
        { body: CARRY, count: 20 },
        { body: MOVE, count: 10 },
      ]),
    },
    repairer: {
      count: 1,
      body: generatorRoleBody([
        { body: WORK, count: 5 },
        { body: CARRY, count: 15 },
        { body: MOVE, count: 10 },
      ]),
    },
    upgrader: {
      count: 5,
      body: generatorRoleBody([
        { body: WORK, count: 5 },
        { body: CARRY, count: 20 },
        { body: MOVE, count: 13 },
      ]),
    },
    builder: {
      count: 0,
      body: generatorRoleBody([
        { body: WORK, count: 5 },
        { body: CARRY, count: 15 },
        { body: MOVE, count: 10 },
      ]),
    },
    remoteMiner: {
      count: 0,
      body: generatorRoleBody([
        { body: WORK, count: 6 },
        { body: CARRY, count: 1 },
        { body: MOVE, count: 4 },
      ]),
    },
    remoteHarvester: {
      count: 0,
      body: generatorRoleBody([
        { body: CARRY, count: 6 },
        { body: MOVE, count: 3 },
      ]),
    },
  },
};

export default strategy;
