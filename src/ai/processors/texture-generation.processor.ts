import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { AiService } from '../ai.service';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { Logger } from '@nestjs/common';
import { readFile } from 'fs/promises';
import { join } from 'path';
import {
  ChatCompletionMessageParam,
  ChatCompletionContentPart,
} from 'openai/resources/chat/completions';
import { TexturesService } from '../../textures/textures.service';
import { PrismaService } from '../../prisma/prisma.service';

type DalleSize =
  | '256x256'
  | '512x512'
  | '1024x1024'
  | '1792x1024'
  | '1024x1792';

@Processor('texture-generation')
export class TextureGenerationProcessor {
  private readonly logger = new Logger(TextureGenerationProcessor.name);
  private openai: OpenAI;

  constructor(
    private aiService: AiService,
    private configService: ConfigService,
    private texturesService: TexturesService,
    private prisma: PrismaService,
  ) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }
    this.openai = new OpenAI({ apiKey });
  }

  private async generateUniqueSlug(baseSlug: string): Promise<string> {
    let slug = baseSlug
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    let counter = 1;
    let uniqueSlug = slug;

    while (true) {
      const existing = await this.prisma.texture.findUnique({
        where: { slug: uniqueSlug },
      });

      if (!existing) {
        break;
      }

      uniqueSlug = `${slug}-${counter}`;
      counter++;
    }

    return uniqueSlug;
  }

  @Process('generate')
  async handleGeneration(
    job: Job<{
      jobId: string;
      userId: string;
      prompt: string;
      imagePaths?: string[];
      size: DalleSize;
    }>,
  ) {
    const { jobId, userId, prompt, imagePaths, size } = job.data;

    try {
      await this.aiService.handleWebhook(jobId, 'processing', 'generate');

      let enhancedPrompt = prompt;
      if (imagePaths?.length) {
        enhancedPrompt = await this.generateDallePrompt(
          imagePaths,
          prompt,
          size,
        );
      }

      const imageUrl = await this.generateImage(enhancedPrompt, size);
      const imageBuffer = await this.downloadImage(imageUrl);
      const description = await this.generateImageDescription(imageBuffer);

      const timestamp = Date.now();
      const key = `generated/${userId}/${timestamp}.png`;

      await this.texturesService.uploadToS3(imageBuffer, key);

      const slug = await this.generateUniqueSlug(description);

      const texture = await this.prisma.texture.create({
        data: {
          userId,
          name: description,
          slug,
          tags: ['generated'],
          s3Key: key,
          resolution: size,
        },
      });

      await this.aiService.handleWebhook(jobId, 'completed', 'generate', [
        imageUrl,
      ]);

      return texture;
    } catch (error) {
      await this.aiService.handleWebhook(jobId, 'failed', 'generate');
      throw error;
    }
  }

  @Process('modify')
  async handleModification(
    job: Job<{
      jobId: string;
      userId: string;
      prompt: string;
      imageUrl: string;
    }>,
  ) {
    const { jobId, userId, prompt, imageUrl } = job.data;

    try {
      await this.aiService.handleWebhook(jobId, 'processing', 'modify');

      const imageBuffer = await this.downloadImage(imageUrl);
      const modifiedImageUrl = await this.editImage(imageBuffer, prompt);
      const modifiedBuffer = await this.downloadImage(modifiedImageUrl);
      const description = await this.generateImageDescription(modifiedBuffer);

      const timestamp = Date.now();
      const key = `modified/${userId}/${timestamp}_modified.png`;

      await this.texturesService.uploadToS3(modifiedBuffer, key);

      const slug = await this.generateUniqueSlug(description);

      const texture = await this.prisma.texture.create({
        data: {
          userId,
          name: description,
          slug,
          tags: ['modified'],
          s3Key: key,
          resolution: '1k',
        },
      });

      await this.aiService.handleWebhook(jobId, 'completed', 'modify', [
        modifiedImageUrl,
      ]);

      return texture;
    } catch (error) {
      await this.aiService.handleWebhook(jobId, 'failed', 'modify');
      throw error;
    }
  }

  @Process('upscale')
  async handleUpscale(
    job: Job<{ jobId: string; userId: string; imageUrl: string }>,
  ) {
    const { jobId, userId, imageUrl } = job.data;

    try {
      await this.aiService.handleWebhook(jobId, 'processing', 'upscale');

      const imageBuffer = await this.downloadImage(imageUrl);
      const upscaledImageUrl = await this.upscaleImage(imageBuffer);
      const upscaledBuffer = await this.downloadImage(upscaledImageUrl);

      // Generate descriptions for both images
      const originalDescription =
        await this.generateImageDescription(imageBuffer);
      const upscaledDescription =
        await this.generateImageDescription(upscaledBuffer);

      // Upload both versions to S3
      const timestamp = Date.now();
      const originalKey = `textures/${userId}/${timestamp}_original.png`;
      const upscaledKey = `textures/${userId}/${timestamp}_upscaled.png`;

      // Upload original image
      await this.texturesService.uploadToS3(imageBuffer, originalKey);

      // Upload upscaled image
      await this.texturesService.uploadToS3(upscaledBuffer, upscaledKey);

      const originalSlug = await this.generateUniqueSlug(originalDescription);
      const upscaledSlug = await this.generateUniqueSlug(upscaledDescription);

      // Create texture records
      const originalTexture = await this.prisma.texture.create({
        data: {
          userId,
          name: originalDescription,
          slug: originalSlug,
          tags: ['original'],
          s3Key: originalKey,
          resolution: '1k',
        },
      });

      const upscaledTexture = await this.prisma.texture.create({
        data: {
          userId,
          name: upscaledDescription,
          slug: upscaledSlug,
          tags: ['upscaled'],
          s3Key: upscaledKey,
          resolution: '4k',
        },
      });

      await this.aiService.handleWebhook(jobId, 'completed', 'upscale', [
        upscaledImageUrl,
      ]);

      return { originalTexture, upscaledTexture };
    } catch (error) {
      await this.aiService.handleWebhook(jobId, 'failed', 'upscale');
      throw error;
    }
  }

  private async encodeImage(imagePath: string): Promise<string> {
    try {
      const file = await readFile(join(process.cwd(), imagePath));
      return file.toString('base64');
    } catch (error) {
      this.logger.error(`Error encoding image: ${error.message}`);
      throw new Error('Failed to process image');
    }
  }

  private async generateDallePrompt(
    imagePaths: string[],
    userPrompt: string,
    size: DalleSize,
  ): Promise<string> {
    try {
      const base64Images = await Promise.all(
        imagePaths.map((path) => this.encodeImage(path)),
      );

      const messageContent: ChatCompletionContentPart[] = [
        {
          type: 'text',
          text:
            `${userPrompt}. ` +
            'Generate a detailed DALL-E 3 prompt focusing on style, colors, and composition. ' +
            'Use the reference images to create a detailed prompt. ' +
            'The generated prompt should be regarding a texture with a repeatable pattern. ' +
            `Limit the prompt to ${['256x256', '512x512'].includes(size) ? '1000' : '4000'} characters.`,
        },
        ...base64Images.map((image) => ({
          type: 'image_url' as const,
          image_url: {
            url: `data:image/jpeg;base64,${image}`,
          },
        })),
      ];

      const messages: ChatCompletionMessageParam[] = [
        {
          role: 'user',
          content: messageContent,
        },
      ];

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages,
        max_tokens: 300,
      });

      const generatedContent = response.choices[0].message.content;
      if (!generatedContent) {
        throw new Error('No content generated from GPT-4V');
      }
      return generatedContent;
    } catch (error) {
      this.logger.error(`GPT-4V error: ${error.message}`);
      throw new Error('Failed to generate prompt');
    }
  }

  private async generateImage(
    prompt: string,
    size: DalleSize,
  ): Promise<string> {
    try {
      const model = ['256x256', '512x512'].includes(size)
        ? 'dall-e-2'
        : 'dall-e-3';
      const response = await this.openai.images.generate({
        model,
        prompt,
        size,
        quality: 'hd',
        style: 'natural',
        n: 1,
      });

      const imageUrl = response.data[0].url;
      if (!imageUrl) {
        throw new Error('No image URL generated from DALL-E');
      }
      return imageUrl;
    } catch (error) {
      this.logger.error(`DALL-E error: ${error.message}`);
      throw new Error('Failed to generate image');
    }
  }

  private async editImage(
    imageBuffer: Buffer,
    prompt: string,
  ): Promise<string> {
    try {
      const file = new File([imageBuffer], 'texture.png', {
        type: 'image/png',
      });
      const response = await this.openai.images.edit({
        image: file,
        prompt,
        n: 1,
        model: 'dall-e-2',
        size: '256x256',
      });
      const imageUrl = response.data[0].url;
      if (!imageUrl) {
        throw new Error('No image URL generated from DALL-E');
      }
      return imageUrl;
    } catch (error) {
      this.logger.error(`DALL-E error: ${error.message}`);
      throw new Error('Failed to edit image');
    }
  }

  private async upscaleImage(imageBuffer: Buffer): Promise<string> {
    const file = new File([imageBuffer], 'texture.png', { type: 'image/png' });
    const response = await this.openai.images.edit({
      image: file,
      prompt:
        'Upscale the image to 1024x1024. Keep the original image details. Do not add anything to the image. Just upscale it.',
      n: 1,
      model: 'dall-e-3',
      size: '1024x1024',
    });
    const imageUrl = response.data[0].url;
    if (!imageUrl) {
      throw new Error('No image URL generated from DALL-E');
    }
    return imageUrl;
  }

  private async downloadImage(imageUrl: string): Promise<Buffer> {
    const response = await fetch(imageUrl);
    const buffer = await response.arrayBuffer();
    return Buffer.from(buffer);
  }

  private async generateVariations(imageBuffer: Buffer): Promise<string[]> {
    const file = new File([imageBuffer], 'texture.png', { type: 'image/png' });
    const response = await this.openai.images.createVariation({
      image: file,
      n: 3,
      size: '256x256',
    });
    return response.data
      .map((img) => img.url)
      .filter((url): url is string => url !== undefined);
  }

  private async generateImageDescription(imageBuffer: Buffer): Promise<string> {
    try {
      const base64Image = imageBuffer.toString('base64');

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Generate a short, descriptive title for this texture image. Focus on the main visual elements, colors, and patterns. Keep it concise and descriptive, like "Blue Marble Wall" or "Rustic Wood Grain".',
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/png;base64,${base64Image}`,
                },
              },
            ],
          },
        ],
      });

      const description = response.choices[0].message.content;
      if (!description) {
        throw new Error('No description generated');
      }
      return description.trim();
    } catch (error) {
      this.logger.error(`Error generating description: ${error.message}`);
      return 'Untitled Texture';
    }
  }
}
