import { memory } from './memory';
import { statusMain } from './status';
import { task } from './task';

const monitorMain = () => {
  statusMain();
  memory();
  task();
};

export default monitorMain;
