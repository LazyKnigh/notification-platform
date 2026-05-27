import { IsEnum, IsInt, IsObject, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { NotificationChannelDto } from './notification.enums';

export class CreateNotificationDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  userId!: number;

  @IsEnum(NotificationChannelDto)
  channel!: NotificationChannelDto;

  @IsObject()
  payload!: Record<string, unknown>;
}
