import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { join } from 'path';
import { mkdirSync } from 'fs';
import { ApiResponseInterceptor } from './common/api-response.interceptor';
import { HttpExceptionFilter } from './common/http-exception.filter';

async function bootstrap() {
  const uploadPath=join(process.cwd(), process.env.UPLOAD_PATH || 'uploads');
  mkdirSync(uploadPath,{recursive:true});
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useStaticAssets(uploadPath, { prefix: '/uploads/' });
  app.use(helmet());
  app.enableCors({ origin: process.env.FRONTEND_ORIGIN || 'http://localhost:3031', credentials: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  app.useGlobalInterceptors(new ApiResponseInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());
  await app.listen(3030);
}
void bootstrap();
