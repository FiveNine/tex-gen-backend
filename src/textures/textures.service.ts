import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class TexturesService {
  private s3Client: S3Client;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
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
    const textures = await this.prisma.texture.findMany({
      where: { userId },
      take: limit,
      ...(cursor && { cursor: { id: cursor } }),
      orderBy: { createdAt: 'desc' },
    });

    const nextCursor =
      textures.length === limit ? textures[textures.length - 1].id : null;

    return {
      textures,
      nextCursor,
    };
  }

  async findOne(id: string, userId: string) {
    const texture = await this.prisma.texture.findFirst({
      where: { id, userId },
    });

    if (!texture) {
      throw new NotFoundException('Texture not found');
    }

    return texture;
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
    const texture = await this.findOne(id, userId);

    // Delete from S3
    const deleteCommand = new DeleteObjectCommand({
      Bucket: this.configService.get('AWS_S3_BUCKET'),
      Key: texture.s3Key,
    });
    await this.s3Client.send(deleteCommand);

    // Delete from database
    return this.prisma.texture.delete({
      where: { id },
    });
  }

  async search(userId: string, query: string, cursor?: string, limit = 10) {
    const textures = await this.prisma.texture.findMany({
      where: {
        userId,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { tags: { has: query } },
        ],
      },
      take: limit,
      ...(cursor && { cursor: { id: cursor } }),
      orderBy: { createdAt: 'desc' },
    });

    const nextCursor =
      textures.length === limit ? textures[textures.length - 1].id : null;

    return {
      textures,
      nextCursor,
    };
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
}
