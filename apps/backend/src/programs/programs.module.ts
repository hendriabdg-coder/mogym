import { Module } from '@nestjs/common';
import { OnboardingController } from './onboarding.controller';
import { OnboardingService } from './onboarding.service';
import { ProgramRecommendationService } from './program-recommendation.service';
import { SessionBuilderService } from './session-builder.service';

@Module({
  controllers:[OnboardingController],
  providers:[OnboardingService,ProgramRecommendationService,SessionBuilderService],
  exports:[ProgramRecommendationService,SessionBuilderService],
})
export class ProgramsModule {}
