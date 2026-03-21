import { NestFactory } from '@nestjs/core';
import { WorkerModule } from './worker.module';

async function bootstrap() {
  const app = await NestFactory.create(WorkerModule, {
    // Worker HTTP sunmuyor — sadece BullMQ consumer
    logger: ['log', 'warn', 'error'],
  });

  // Railway process-alive health check için minimal HTTP
  const port = process.env.WORKER_PORT ?? 3002;
  await app.listen(port);

  console.log(`⚙️  Worker running — listening for jobs on Redis`);
  console.log(`❤️  Health check: http://localhost:${port}/health`);
}

bootstrap();