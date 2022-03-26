import * as TE from 'fp-ts/TaskEither';

import { Connection } from './connection';
import { ConnectionError } from './error';

export interface Pool {
  connect: () => TE.TaskEither<ConnectionError, Connection>;
}
