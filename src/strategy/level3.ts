import { generatorRoleBody } from '@/utils/lib/base/role';
import { StrategyType } from '.';

const strategy: StrategyType = {
  roleMonitor: {
    harvester: {
      count: 8,
      body: generatorRoleBody([
        { body: CARRY, count: 10 },
        { body: MOVE, count: 6 },
      ]),
    },
    builder: {
      count: 2,
      body: generatorRoleBody([
        { body: WORK, count: 3 },
        { body: CARRY, count: 5 },
        { body: MOVE, count: 5 },
      ]),
    },
    upgrader: {
      count: 14,
      body: generatorRoleBody([
        { body: WORK, count: 3 },
        { body: CARRY, count: 5 },
        { body: MOVE, count: 5 },
      ]),
    },
    miner: {
      count: 0,
      body: generatorRoleBody([
        { body: WORK, count: 8 },
        { body: CARRY, count: 1 },
        { body: MOVE, count: 1 },
      ]),
    },
    minerStore: {
      count: 0,
      body: generatorRoleBody([
        { body: CARRY, count: 15 },
        { body: MOVE, count: 1 },
      ]),
    },
    repairer: {
      count: 4,
      body: generatorRoleBody([
        { body: WORK, count: 3 },
        { body: CARRY, count: 5 },
        { body: MOVE, count: 5 },
      ]),
    },
  },
};

export default strategy;
