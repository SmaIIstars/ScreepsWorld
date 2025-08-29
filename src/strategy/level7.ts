import { generatorRoleBody } from '@/utils';
import { StrategyType } from '.';

const strategy: StrategyType = {
  roleMonitor: {
    miner: {
      count: 2,
      body: generatorRoleBody([
        { body: WORK, count: 10 },
        //  { body: CARRY, count: 1 },
        { body: MOVE, count: 5 },
      ]),
    },
    harvester: {
      count: 2,
      body: generatorRoleBody([
        { body: CARRY, count: 30 },
        { body: MOVE, count: 15 },
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
      count: 1,
      body: generatorRoleBody([
        { body: WORK, count: 10 },
        { body: CARRY, count: 20 },
        { body: MOVE, count: 15 },
      ]),
    },
    builder: {
      count: 1,
      body: generatorRoleBody([
        { body: WORK, count: 10 },
        { body: CARRY, count: 20 },
        { body: MOVE, count: 15 },
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
