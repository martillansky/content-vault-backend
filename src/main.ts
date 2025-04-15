import { NestFactory } from '@nestjs/core';
import * as dotenv from 'dotenv';
import { AppModule } from './app.module';
dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: ['http://localhost:3000', 'https://libelula-space.netlify.app/'],
    methods: ['GET', 'POST'],
    credentials: true,
  });

  await app.listen(process.env.PORT || 3001);
}
bootstrap();
