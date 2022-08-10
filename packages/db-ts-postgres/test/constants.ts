import * as DB from 'db-ts/src';
import { PostgresConnectionConfig } from '../src/engine';

export const TEST_DATABASE_CONFIG: PostgresConnectionConfig = {
  host: 'localhost',
  port: 5432,
  user: 'test',
  database: 'test',
  password: 'test',
};

export const DUMMY_CONFIG: PostgresConnectionConfig = {
  host: 'host',
  port: 1234,
  user: 'user',
  database: 'database',
  password: 'password',
};

export const TEST_TABLE = 'db_ts_test_table';

export const CREATE_TEST_TABLE_QUERY = DB.sql`
  CREATE TABLE ${TEST_TABLE} (
    id      integer,
    name    varchar(40),
    PRIMARY KEY(id)
  );
`;

export const DROP_TEST_TABLE_QUERY = DB.sql`DROP TABLE IF EXISTS ${TEST_TABLE};`;

export const TEST_TABLE_EXISTS_QUERY = DB.sql`
  SELECT EXISTS (
    SELECT FROM information_schema.tables WHERE table_name = '${TEST_TABLE}'
  );
`;
