import { ApiProperty } from '@nestjs/swagger';

export class ErrorResponseDto {
  @ApiProperty({
    description: 'Error message describing what went wrong',
    example: 'Invalid credentials',
  })
  message: string;

  @ApiProperty({
    description: 'Error code for the specific error type',
    example: 'AUTH_INVALID_CREDENTIALS',
  })
  code: string;

  @ApiProperty({
    description: 'HTTP status code',
    example: 401,
  })
  statusCode: number;
}
