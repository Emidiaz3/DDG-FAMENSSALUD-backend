import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.use(cookieParser());

  const allowedOrigins = [
    'https://3000-firebase-famensalud-fronted-1763133600094.cluster-hkcruqmgzbd2aqcdnktmz6k7ba.cloudworkstations.dev',
    'https://9000-firebase-famensalud-fronted-1763133600094.cluster-hkcruqmgzbd2aqcdnktmz6k7ba.cloudworkstations.dev',
    'http://localhost:4200', // opcional
    'http://localhost:3000', // opcional
  ];

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    // methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    // allowedHeaders: ['Content-Type', 'Authorization'],
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
