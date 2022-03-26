import * as TE from 'fp-ts/TaskEither';

import { Connection } from './connection';
import { DatabaseError } from './error';

import { Pool } from './pool';

export interface Engine {
  createPool: () => Pool;
  createConnection: () => TE.TaskEither<DatabaseError, Connection>;
}

/**
 * Create a new connection from the engine.
 *
 * @category combinators
 */
export const createConnection = (
  engine: Engine
): TE.TaskEither<DatabaseError, Connection> => engine.createConnection();

/**
 * Create a new pool from the engine.
 *
 * @category combinators
 */
export const createPool = (engine: Engine): Pool => engine.createPool();
