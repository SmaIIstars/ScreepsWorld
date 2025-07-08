import { BaseRole } from '../utils/lib/role';

declare global {
  var utils: {
    role: Record<string, BaseRole>;
  };
}

export {};
