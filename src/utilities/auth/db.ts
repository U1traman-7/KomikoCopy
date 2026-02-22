import { Kysely, PostgresDialect, type GeneratedAlways } from 'kysely';
import pg, { Pool } from 'pg';

// kysely adapter needs to know the schema of our postgres. We defined it here. And export a
// reference
interface Database {
  User: {
    id: GeneratedAlways<string>;
    name: string | null;
    email: string;
    emailVerified: Date | null;
    image: string | null;
  };
  Account: {
    id: GeneratedAlways<string>;
    userId: string;
    type: string;
    provider: string;
    providerAccountId: string;
    refresh_token: string | null;
    access_token: string | null;
    expires_at: number | null;
    token_type: string | null;
    scope: string | null;
    id_token: string | null;
    session_state: string | null;
  };
  Session: {
    id: GeneratedAlways<string>;
    userId: string;
    sessionToken: string;
    expires: Date;
  };
  VerificationToken: {
    identifier: string;
    token: string;
    expires: Date;
  };
}

const connectionString = process.env.POSTGRES_URL;
// const connectionString = process.env.DIRECT_URL;

// const pool = new Pool({
//   connectionString,
// });

const dialect = new PostgresDialect({
  pool: {
    async connect() {
      const client = new pg.Client({
        connectionString,
        // 建议强制 SSL，Supabase 通常要求
        ssl: { rejectUnauthorized: false },
      });
      await client.connect();
      return {
        async query(sql, params) {
          return client.query(sql, params);
        },
        async release() {
          await client.end();
        },
      };
    },
  },
});

// console.log("hello puh")
export const db = new Kysely<Database>({
  // dialect: new PostgresDialect({
  //   pool,
  // }),
  dialect,
});
