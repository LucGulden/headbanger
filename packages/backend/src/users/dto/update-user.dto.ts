import { IsString, IsOptional, MinLength, MaxLength, Matches } from 'class-validator'

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(3, { message: 'Username must be at least 3 characters long' })
  @MaxLength(20, { message: 'Username must not exceed 20 characters' })
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message: 'Username can only contain letters, numbers, underscores and hyphens',
  })
  username?: string

  @IsOptional()
  @IsString()
  @MaxLength(50)
  firstName?: string

  @IsOptional()
  @IsString()
  @MaxLength(50)
  lastName?: string

  @IsOptional()
  @IsString()
  @MaxLength(200, { message: 'Bio must not exceed 200 characters' })
  bio?: string

  @IsOptional()
  @IsString()
  photoUrl?: string
}
