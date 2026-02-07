import { IsString, Matches } from 'class-validator';

export class JoinRoomDto {
  @IsString()
  @Matches(/^post:[a-f0-9-]+$/, {
    message: 'roomId must be in format: post:{uuid}',
  })
  roomId: string;
}