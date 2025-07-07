import { intervalSleep } from '..';
import { generatorRole } from './generatorRole';
import { memory } from './memory';
import { task } from './task';

const monitorMain = () => {
  task();
  memory();
  intervalSleep(10, generatorRole);
  // intervalSleep(10, plan);
};

export default monitorMain;
