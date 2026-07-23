import { Module } from '@nestjs/common';
import { FoodChecklistController } from './food-checklist.controller';
import { FoodChecklistService } from './food-checklist.service';
import { ProgressPhotoController } from './progress-photo.controller';
import { ProgressPhotoService } from './progress-photo.service';
@Module({controllers:[FoodChecklistController,ProgressPhotoController],providers:[FoodChecklistService,ProgressPhotoService]})
export class OptionalModule{}
