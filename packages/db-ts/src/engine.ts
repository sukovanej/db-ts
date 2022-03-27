import * as TE from 'fp-ts/TaskEither';
import { pipe } from 'fp-ts/function';

import { closeConnection, Connection } from './connection';
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

/**
 * Run a task on a connection created from the engine. Connection is closed
 * after the task is done.
 *
 * @category combinators
 */
export const withConnection =
  <A, E>(f: (connection: Connection) => TE.TaskEither<E, A>) =>
  (engine: Engine): TE.TaskEither<DatabaseError | E, A> =>
    TE.bracket<DatabaseError | E, Connection, A>(
      pipe(engine, createConnection),
      f,
      closeConnection
    );
