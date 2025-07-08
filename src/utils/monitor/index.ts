import { memory } from './memory';
import { task } from './task';

const monitorMain = () => {
  memory();
  task();
};

export default monitorMain;
