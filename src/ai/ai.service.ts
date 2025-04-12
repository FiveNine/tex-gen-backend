import {
  Injectable,
  BadRequestException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '../prisma/prisma.service';
import OpenAI from 'openai';
import { ConfigService } from '@nestjs/config';
import { GenerateImageDto } from './dto/generate-image.dto';
import { ModifyImageDto } from './dto/modify-image.dto';

type DalleSize =
  | '256x256'
  | '512x512'
  | '1024x1024'
  | '1792x1024'
  | '1024x1792';

@Injectable()
export class AiService {
  private openai: OpenAI;
  private readonly logger = new Logger(AiService.name);

  constructor(
    @InjectQueue('texture-generation') private textureQueue: Queue,
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }
    this.openai = new OpenAI({ apiKey });
  }

  async generateTexture(userId: string, dto: GenerateImageDto) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (user.credits <= 0) {
        throw new BadRequestException('Insufficient credits');
      }

      const job = await this.prisma.generationJob.create({
        data: {
          userId,
          prompt: dto.prompt,
          status: 'pending',
          size: '1024x1024',
        },
      });

      await this.textureQueue.add('generate', {
        jobId: job.id.toString(),
        userId,
        prompt: dto.prompt,
        imagePaths: dto.imagePaths,
        size: '1024x1024',
      });

      return { jobId: job.id.toString(), status: 'pending' };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException('Failed to generate texture');
    }
  }

  async getJobStatus(jobId: string) {
    try {
      const dbJob =
        (await this.prisma.generationJob.findUnique({
          where: { id: jobId },
        })) ||
        (await this.prisma.modificationJob.findUnique({
          where: { id: jobId },
        })) ||
        (await this.prisma.upscaleJob.findUnique({
          where: { id: jobId },
        }));

      if (!dbJob) {
        throw new NotFoundException('Job not found');
      }

      return {
        id: jobId,
        state: dbJob.status,
        progress: 0, // Progress is not stored in database
        result: null, // Result is stored in specific fields (genImages, images, upscaledImage)
        status: dbJob.status,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to get job status');
    }
  }

  async getJobResults(jobId: string) {
    const job = await this.prisma.generationJob.findFirst({
      where: { id: jobId },
      select: { genImages: true },
    });

    if (!job) {
      throw new BadRequestException('Job not found');
    }

    return {
      textures: job.genImages.map((imageUrl) => ({
        id: jobId,
        name: 'Generated Texture',
        slug: `texture-${jobId}`,
        s3Key: imageUrl,
        resolution: '1024x1024',
      })),
    };
  }

  async handleWebhook(
    jobId: string,
    status: string,
    type: string,
    result?: string[],
  ) {
    if (!jobId) {
      throw new BadRequestException('Job ID is required');
    }

    if (type === 'generate') {
      await this.prisma.generationJob.update({
        where: { id: jobId },
        data: {
          status,
          genImages: result,
        },
      });
    } else if (type === 'modify') {
      await this.prisma.modificationJob.update({
        where: { id: jobId },
        data: {
          status,
          ...(result && result.length > 0 && { images: { push: result[0] } }),
        },
      });
    } else if (type === 'upscale') {
      await this.prisma.upscaleJob.update({
        where: { id: jobId },
        data: {
          status,
          ...(result && result.length > 0 && { upscaledImage: result[0] }),
        },
      });
    }
  }

  async modifyTexture(userId: string, dto: ModifyImageDto) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (user.credits <= 0) {
        throw new BadRequestException('Insufficient credits');
      }

      const job = await this.prisma.modificationJob.create({
        data: {
          userId,
          generationJobId: dto.jobId,
          prompt: dto.prompt,
          status: 'pending',
          modifications: 0,
        },
      });

      await this.textureQueue.add('modify', {
        jobId: job.id.toString(),
        userId,
        originalJobId: dto.jobId,
        imageUrl: dto.imageUrl,
        prompt: dto.prompt,
        imagePaths: dto.imagePaths,
      });

      return { jobId: job.id.toString(), status: 'pending' };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException('Failed to modify texture');
    }
  }

  async upscaleTexture(userId: string, jobId: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (user.credits <= 0) {
        throw new BadRequestException('Insufficient credits');
      }

      const job = await this.prisma.upscaleJob.create({
        data: {
          userId,
          status: 'pending',
          originalImage: jobId,
        },
      });

      await this.textureQueue.add('upscale', {
        jobId: job.id.toString(),
        userId,
        originalJobId: jobId,
      });

      return { jobId: job.id.toString(), status: 'pending' };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException('Failed to upscale texture');
    }
  }
}
