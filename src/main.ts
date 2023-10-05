import { NestFactory } from '@nestjs/core';
import { ApplicationModule } from './app.module';
import { Logger } from 'nestjs-pino';

async function bootstrap() {
  const app = await NestFactory.create(ApplicationModule);
  app.useLogger(app.get(Logger));
  await app.listen(3002);
}

bootstrap();
