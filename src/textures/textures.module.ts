import { Module } from '@nestjs/common';
import { TexturesService } from './textures.service';
import { TexturesController } from './textures.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [TexturesController],
  providers: [TexturesService],
  exports: [TexturesService],
})
export class TexturesModule {}
