import extensionMain from './extension';
import { loop } from './index';
import { roles } from './lib/role';

extensionMain();
global.utils = { roles };
global.rooms = {};
module.exports = { loop };
