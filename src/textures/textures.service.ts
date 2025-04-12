import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { S3Service } from '../common/services/s3.service';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '../common/exceptions/custom.exceptions';

@Injectable()
export class TexturesService {
  private s3Client: S3Client;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private s3Service: S3Service,
  ) {
    const region = this.configService.get<string>('AWS_REGION');
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>(
      'AWS_SECRET_ACCESS_KEY',
    );

    if (!region || !accessKeyId || !secretAccessKey) {
      throw new Error('AWS credentials not configured');
    }

    this.s3Client = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  async findAll(userId: string, cursor?: string, limit = 10) {
    try {
      const textures = await this.prisma.texture.findMany({
        where: { userId },
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { createdAt: 'desc' },
      });

      const hasMore = textures.length > limit;
      const items = hasMore ? textures.slice(0, -1) : textures;
      const nextCursor = hasMore ? items[items.length - 1].id : null;

      return { textures: items, nextCursor, hasMore };
    } catch (error) {
      throw new BadRequestException('Failed to fetch textures');
    }
  }

  async findOne(id: string, userId: string) {
    try {
      const texture = await this.prisma.texture.findUnique({
        where: { id },
      });

      if (!texture) {
        throw new NotFoundException('Texture not found');
      }

      if (texture.userId !== userId) {
        throw new ForbiddenException(
          'You do not have permission to access this texture',
        );
      }

      return texture;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new BadRequestException('Failed to fetch texture');
    }
  }

  async create(
    userId: string,
    data: {
      name: string;
      slug: string;
      tags: string[];
      s3Key: string;
      resolution: string;
    },
  ) {
    return this.prisma.texture.create({
      data: {
        ...data,
        userId,
      },
    });
  }

  async delete(id: string, userId: string) {
    try {
      const texture = await this.prisma.texture.findUnique({
        where: { id },
      });

      if (!texture) {
        throw new NotFoundException('Texture not found');
      }

      if (texture.userId !== userId) {
        throw new ForbiddenException(
          'You do not have permission to delete this texture',
        );
      }

      await this.s3Service.deleteObject(texture.s3Key);
      return this.prisma.texture.delete({
        where: { id },
      });
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new BadRequestException('Failed to delete texture');
    }
  }

  async search(userId: string, query: string, cursor?: string, limit = 10) {
    try {
      const textures = await this.prisma.texture.findMany({
        where: {
          userId,
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { tags: { hasSome: [query] } },
          ],
        },
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { createdAt: 'desc' },
      });

      const hasMore = textures.length > limit;
      const items = hasMore ? textures.slice(0, -1) : textures;
      const nextCursor = hasMore ? items[items.length - 1].id : null;

      return { textures: items, nextCursor, hasMore };
    } catch (error) {
      throw new BadRequestException('Failed to search textures');
    }
  }

  async uploadToS3(buffer: Buffer, key: string) {
    const command = new PutObjectCommand({
      Bucket: this.configService.get('AWS_S3_BUCKET'),
      Key: key,
      Body: buffer,
      ContentType: 'image/png',
    });

    await this.s3Client.send(command);
    return key;
  }

  async getUploadUrl() {
    try {
      const key = `uploads/${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const url = await this.s3Service.getSignedUrl(key);
      return { url, key };
    } catch (error) {
      throw new BadRequestException('Failed to generate upload URL');
    }
  }
}
