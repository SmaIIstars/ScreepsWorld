import { memory } from './memory';
import { tempScriptTask } from './tempTask';

const monitorMain = (room: Room) => {
  memory(room);
  tempScriptTask();
};

export default monitorMain;
