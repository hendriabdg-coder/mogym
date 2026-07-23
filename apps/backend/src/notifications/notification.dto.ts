import { IsArray, IsBoolean, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class SubscribeDto {
  @IsString() endpoint!: string;
  @IsString() p256dh!: string;
  @IsString() auth!: string;
  @IsOptional() @IsString() userAgent?: string;
}
export class UnsubscribeDto { @IsString() endpoint!: string; }
export class NotificationSettingsDto {
  @IsOptional() @IsBoolean() workoutReminder?: boolean;
  @IsOptional() @IsInt() @Min(0) @Max(23) workoutReminderHour?: number;
  @IsOptional() @IsInt() @Min(0) @Max(59) workoutReminderMinute?: number;
  @IsOptional() @IsBoolean() postWorkoutReminder?: boolean;
  @IsOptional() @IsBoolean() weighReminder?: boolean;
  @IsOptional() @IsInt() @Min(0) @Max(23) weighReminderHour?: number;
  @IsOptional() @IsInt() @Min(0) @Max(59) weighReminderMinute?: number;
  @IsOptional() @IsBoolean() foodChecklistReminder?: boolean;
  @IsOptional() @IsBoolean() evaluationReminder?: boolean;
  @IsOptional() @IsBoolean() missedSessionReminder?: boolean;
  @IsOptional() @IsArray() quietDays?: number[];
}
