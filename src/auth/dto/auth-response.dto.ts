import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({
    description: 'User ID',
    example: 'cl1234567890',
  })
  id: string;

  @ApiProperty({
    description: 'User email',
    example: 'user@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'User name',
    example: 'John Doe',
  })
  name: string;

  @ApiProperty({
    description: 'User subscription plan',
    example: 'free',
  })
  subscriptionPlan: string;

  @ApiProperty({
    description: 'User credits',
    example: 5,
  })
  credits: number;
}

export class AuthResponseDto {
  @ApiProperty({
    description: 'User information',
    example: {
      id: '123',
      email: 'user@example.com',
      name: 'John Doe',
    },
  })
  user: {
    id: string;
    email: string;
    name: string;
  };

  @ApiProperty({
    description: 'JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: 'JWT refresh token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refreshToken: string;
}

export class TokenResponseDto {
  @ApiProperty({
    description: 'JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: 'JWT refresh token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refreshToken: string;
}
