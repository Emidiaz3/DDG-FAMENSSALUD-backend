// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeguridadModule } from './seguridad/seguridad.module';
import { AfiliadosModule } from './afiliados/afiliados.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'mssql',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT) || 1433,
      username: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: false, // MUY IMPORTANTE: false en producción
      options: {
        encrypt: false, // ajusta según tu servidor
      },
    }),
    SeguridadModule,
    AfiliadosModule,
  ],
})
export class AppModule {}
