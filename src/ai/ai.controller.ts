import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  Req,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';
import { GenerateImageDto } from './dto/generate-image.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ModifyImageDto } from './dto/modify-image.dto';
import { UpscaleImageDto } from './dto/upscale-image.dto';
import {
  JobResponseDto,
  JobStatusResponseDto,
  JobResultsResponseDto,
} from './dto/ai-response.dto';

interface RequestWithUser extends Request {
  user: {
    id: string;
    email: string;
  };
}

@ApiTags('AI')
@Controller('ai')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('generate')
  @ApiOperation({ summary: 'Generate a new texture' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('referenceImages'))
  @ApiResponse({
    status: 201,
    description: 'Job created successfully',
    type: JobResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async generateTexture(
    @Body() dto: GenerateImageDto,
    @UploadedFiles() referenceImages: Express.Multer.File[],
    @CurrentUser() user: { id: string },
  ): Promise<JobResponseDto> {
    return this.aiService.generateTexture(user.id, { ...dto, referenceImages });
  }

  @Get('status/:jobId')
  @ApiOperation({ summary: 'Get job status' })
  @ApiResponse({
    status: 200,
    description: 'Job status retrieved successfully',
    type: JobStatusResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Job not found' })
  async getJobStatus(
    @Param('jobId') jobId: string,
  ): Promise<JobStatusResponseDto> {
    return this.aiService.getJobStatus(jobId);
  }

  @Get('job-results/:jobId')
  @ApiOperation({ summary: 'Get job results' })
  @ApiResponse({
    status: 200,
    description: 'Job results retrieved successfully',
    type: JobResultsResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Job not found' })
  async getJobResults(
    @Param('jobId') jobId: string,
  ): Promise<JobResultsResponseDto> {
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
  @ApiOperation({ summary: 'Modify an existing texture' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('referenceImages'))
  @ApiResponse({
    status: 201,
    description: 'Modification job created successfully',
    type: JobResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Texture not found' })
  async modifyTexture(
    @Body() dto: ModifyImageDto,
    @UploadedFiles() referenceImages: Express.Multer.File[],
    @CurrentUser() user: { id: string },
  ): Promise<JobResponseDto> {
    return this.aiService.modifyTexture(user.id, { ...dto, referenceImages });
  }

  @Post('upscale')
  @ApiOperation({ summary: 'Upscale a texture' })
  @ApiResponse({
    status: 201,
    description: 'Upscale job created successfully',
    type: JobResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Texture not found' })
  async upscaleTexture(
    @Body() dto: UpscaleImageDto,
    @CurrentUser() user: { id: string },
  ): Promise<JobResponseDto> {
    return this.aiService.upscaleTexture(user.id, dto.jobId);
  }
}
