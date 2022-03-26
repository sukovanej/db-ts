import * as TE from 'fp-ts/TaskEither';

import { Connection } from './connection';
import { ConnectionError } from './error';

import { Pool } from './pool';

export interface Engine {
  createPool: () => Pool;
  createConnection: () => TE.TaskEither<ConnectionError, Connection>;
}
