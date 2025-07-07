import { intervalSleep } from '..';
import { generatorRole } from './generatorRole';
import { memory } from './memory';
import { task } from './task';

const monitorMain = () => {
  memory();
  if (!task()) return;

  intervalSleep(10, generatorRole);
  // intervalSleep(10, plan);
};

export default monitorMain;
