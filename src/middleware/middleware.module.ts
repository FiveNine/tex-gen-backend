import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { RequestLoggerMiddleware } from './request-logger.middleware';

@Module({})
export class MiddlewareModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*'); // Apply to all routes
  }
}
