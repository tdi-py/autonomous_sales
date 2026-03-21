import { Module, Global } from '@nestjs/common';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from '@autonomous-sales/database';

export const DATABASE_TOKEN = 'DATABASE';

@Global()  // inject DB into any module without re-importing
@Module({
  providers: [
    {
      provide: DATABASE_TOKEN,
      useFactory: () => {
        const connectionString = process.env.DATABASE_URL;
        if (!connectionString) throw new Error('DATABASE_URL is not set');
        const client = postgres(connectionString, { prepare: false });
        return drizzle(client, { schema });
      },
    },
  ],
  exports: [DATABASE_TOKEN],
})
export class DatabaseModule {}