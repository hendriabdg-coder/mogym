import { PhotoAngle } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsEnum, IsInt, Min } from 'class-validator';
export class UploadProgressPhotoDto {
  @IsEnum(PhotoAngle) angle!:PhotoAngle;
  @Transform(({value})=>Number(value)) @IsInt() @Min(1) weekNumber!:number;
}
