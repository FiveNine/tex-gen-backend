import { Module } from '@nestjs/common';
import { TexturesService } from './textures.service';
import { TexturesController } from './textures.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { S3Service } from '../common/services/s3.service';

@Module({
  imports: [PrismaModule],
  controllers: [TexturesController],
  providers: [TexturesService, S3Service],
  exports: [TexturesService],
})
export class TexturesModule {}
