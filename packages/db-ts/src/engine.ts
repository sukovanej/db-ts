import { Connection, ConnectionNotOpened } from './connection';

import { Pool } from './pool';

export interface Engine {
  createPool: () => Pool;
  createConnection: () => Connection<ConnectionNotOpened>;
}
