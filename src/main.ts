import { loop } from "./index";
import { role, task } from "./utils";

module.exports = { loop };

global.utils = {
  role,
  task,
};
