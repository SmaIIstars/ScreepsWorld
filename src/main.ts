import { loop } from './index';
import { role2, ticksPerMove } from './utils';

module.exports = { loop };

global.utils = { role2, ticksPerMove };
global.rooms = {};
