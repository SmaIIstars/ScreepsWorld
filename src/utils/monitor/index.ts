import { intervalTime } from "..";
import { generatorRole } from "./generatorRole";
import { memory } from "./memory";
import { task } from "./task";

const monitorMain = () => {
  task();
  memory();
  intervalTime(10, generatorRole);
  // intervalTime(10, plan);
};

export default monitorMain;
