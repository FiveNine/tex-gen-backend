import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '../prisma/prisma.service';
import { join } from 'path';
import { readFile } from 'fs/promises';
import {
  ChatCompletionMessageParam,
  ChatCompletionContentPart,
} from 'openai/resources/chat/completions';
import OpenAI from 'openai';
import { ConfigService } from '@nestjs/config';
import { GenerationJob, ModificationJob, Prisma } from '@prisma/client';

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

  async generateTexture(
    prompt: string,
    userId: string,
    imagePaths?: string[],
    size: DalleSize = '1024x1024',
  ) {
    // Check user credits
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { credits: true },
    });

    if (!user || user.credits < 1) {
      throw new Error('Insufficient credits');
    }

    // Create generation job
    const job = await this.prisma.generationJob.create({
      data: {
        userId,
        prompt,
        size,
        status: 'pending',
        imagePaths,
        genImages: [],
      },
    });

    // Add job to queue
    await this.textureQueue.add('generate', {
      jobId: job.id,
      userId,
      prompt,
      imagePaths,
      size,
    });

    // Deduct credits
    await this.prisma.user.update({
      where: { id: userId },
      data: { credits: { decrement: 1 } },
    });

    return {
      jobId: job.id,
      status: 'pending',
    };
  }

  async getJobStatus(jobId: string, userId: string) {
    const job = await this.prisma.generationJob.findFirst({
      where: { id: jobId, userId },
    });

    if (!job) {
      throw new BadRequestException('Job not found');
    }

    return job.status;
  }

  async getJobResults(jobId: string) {
    const job = await this.prisma.generationJob.findFirst({
      where: { id: jobId },
      select: { genImages: true },
    });

    return job?.genImages;
  }

  async handleWebhook(
    jobId: string,
    status: string,
    type: string,
    result?: string[],
  ) {
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

  async modifyTexture(
    jobId: string,
    prompt: string,
    imageUrl: string,
    userId: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    let job: GenerationJob | ModificationJob | null =
      await this.prisma.generationJob.findFirst({
        where: { id: jobId, status: 'completed', userId },
      });

    if (!job) {
      job = await this.prisma.modificationJob.findFirst({
        where: { id: jobId, status: 'completed', userId },
      });
    }

    if (!job) {
      throw new BadRequestException('Job not found or not completed');
    }

    const imageToModify =
      'genImages' in job
        ? job.genImages.find((image) => image === imageUrl)
        : job.images.find((image) => image === imageUrl);

    if (!imageToModify) {
      throw new BadRequestException('Image not found in genImages');
    }

    const modificationJob = await this.prisma.modificationJob.findFirst({
      where: {
        generationJobId: jobId,
      },
    });

    if (modificationJob) {
      await this.prisma.modificationJob.update({
        where: { id: modificationJob.id },
        data: {
          prompt,
          status: 'pending',
          modifications: {
            increment: 1,
          },
        },
      });
    } else {
      await this.prisma.modificationJob.create({
        data: {
          generationJobId: jobId,
          userId: job.userId,
          prompt,
          status: 'pending',
          images: [imageToModify],
          modifications: 0,
        },
      });
    }

    await this.textureQueue.add('modify', {
      jobId,
      userId: job.userId,
      prompt,
      imageUrl,
    });
  }

  async upscaleTexture(jobId: string, imageUrl: string, userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    let job: ModificationJob | GenerationJob | null =
      await this.prisma.modificationJob.findFirst({
        where: { id: jobId, status: 'completed', userId },
      });

    if (!job) {
      job = await this.prisma.generationJob.findFirst({
        where: { id: jobId, status: 'completed', userId },
      });
    }

    if (!job) {
      throw new BadRequestException('Job not found or not completed');
    }

    const imageToUpscale =
      'genImages' in job
        ? job.genImages.find((image) => image === imageUrl)
        : job.images.find((image) => image === imageUrl);

    if (!imageToUpscale) {
      throw new BadRequestException('Image not found in genImages');
    }

    const upscaleJob = await this.prisma.upscaleJob.create({
      data: {
        userId,
        status: 'pending',
        originalImage: imageUrl,
        upscaledImage: null,
      },
    });

    await this.textureQueue.add('upscale', {
      jobId: upscaleJob.id,
      userId,
      imageUrl,
    });

    return {
      jobId: upscaleJob.id,
      status: 'pending',
    };
  }
}
