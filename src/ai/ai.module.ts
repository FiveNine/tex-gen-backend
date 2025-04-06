import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { TextureGenerationProcessor } from './processors/texture-generation.processor';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'texture-generation',
    }),
    PrismaModule,
  ],
  controllers: [AiController],
  providers: [AiService, TextureGenerationProcessor],
  exports: [AiService],
})
export class AiModule {}
