import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';
import { GenerateImageDto } from './dto/generate-image.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

interface RequestWithUser extends Request {
  user: {
    id: string;
    email: string;
  };
}

@ApiTags('AI')
@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('generate')
  @ApiOperation({ summary: 'Generate a texture using AI' })
  @ApiResponse({
    status: 201,
    description: 'Texture generation job created successfully',
    schema: {
      properties: {
        jobId: { type: 'string' },
        status: { type: 'string' },
      },
    },
  })
  async generateTexture(
    @Body() generateImageDto: GenerateImageDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.aiService.generateTexture(
      generateImageDto.prompt,
      userId,
      generateImageDto.imagePaths,
      '256x256',
    );
  }

  @Get('status/:jobId')
  async getJobStatus(
    @Param('jobId') jobId: string,
    @Req() req: RequestWithUser,
  ) {
    return this.aiService.getJobStatus(jobId, req.user.id);
  }

  @Get('job-results/:jobId')
  async getJobResults(@Param('jobId') jobId: string) {
    return this.aiService.getJobResults(jobId);
  }

  @Post('webhook')
  async handleWebhook(
    @Body()
    body: {
      jobId: string;
      status: string;
      type: string;
      result?: string | string[];
    },
  ) {
    const result = body.result
      ? Array.isArray(body.result)
        ? body.result
        : [body.result]
      : undefined;
    return this.aiService.handleWebhook(
      body.jobId,
      body.status,
      body.type,
      result,
    );
  }

  @Post('modify')
  async modifyTexture(
    @Body() body: { jobId: string; prompt: string; imageUrl: string },
    @CurrentUser('id') userId: string,
  ) {
    return this.aiService.modifyTexture(
      body.jobId,
      body.prompt,
      body.imageUrl,
      userId,
    );
  }

  @Post('upscale')
  async upscaleTexture(
    @Body() body: { jobId: string; imageUrl: string },
    @CurrentUser('id') userId: string,
  ) {
    return this.aiService.upscaleTexture(body.jobId, body.imageUrl, userId);
  }
}
