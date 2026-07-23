import { Module } from '@nestjs/common';
import { EvaluationController } from './evaluation.controller';
import { WeeklyEvaluationService } from './evaluation.service';
import { WeightController } from './weight.controller';
import { WeightService } from './weight.service';
@Module({controllers:[WeightController,EvaluationController],providers:[WeightService,WeeklyEvaluationService],exports:[WeeklyEvaluationService]})
export class ProgressModule{}
