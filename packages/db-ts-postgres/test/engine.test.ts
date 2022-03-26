import { ConnectionConfig } from 'db-ts';

import { pipe } from 'fp-ts/function';

import * as DE from '../src/engine';

describe('Postgres engine', () => {
  const DUMMY_CONFIG: ConnectionConfig = {
    host: 'host',
    port: 1234,
    user: 'user',
    database: 'database',
    password: 'password',
  };

  describe('createPostgresEngine', () => {
    it('', () =>
      pipe(DUMMY_CONFIG, DE.createPostgresEngine, engine =>
        expect(engine).toBeTruthy()
      ));
  });
});
