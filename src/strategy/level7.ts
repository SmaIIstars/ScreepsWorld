import { generatorRoleBody } from '@/utils';
import { StrategyType } from '.';

const strategy: StrategyType = {
  roleMonitor: {
    harvester: {
      count: 1,
      body: generatorRoleBody([
        { body: CARRY, count: 30 },
        { body: MOVE, count: 15 },
      ]),
    },
    pioneer: {
      count: 0,
      body: generatorRoleBody([
        { body: WORK, count: 6 },
        { body: CARRY, count: 7 },
        { body: MOVE, count: 7 },
      ]),
    },
    builder: {
      count: 0,
      body: generatorRoleBody([
        { body: WORK, count: 6 },
        { body: CARRY, count: 7 },
        { body: MOVE, count: 7 },
      ]),
    },
    miner: {
      count: 2,
      body: generatorRoleBody([
        { body: WORK, count: 6 },
        { body: CARRY, count: 1 },
        { body: MOVE, count: 4 },
      ]),
    },
    upgrader: {
      count: 1,
      body: generatorRoleBody([
        { body: WORK, count: 10 },
        { body: CARRY, count: 14 },
        { body: MOVE, count: 12 },
      ]),
    },
    repairer: {
      count: 1,
      body: generatorRoleBody([
        { body: WORK, count: 8 },
        { body: CARRY, count: 24 },
        { body: MOVE, count: 16 },
      ]),
    },
  },
};

export default strategy;
