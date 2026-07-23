import { Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { WeeklyEvaluationService } from './evaluation.service';

@Controller('evaluations')
@UseGuards(JwtAuthGuard)
export class EvaluationController {
  constructor(private service:WeeklyEvaluationService,private db:PrismaService){}
  @Post(':weekNumber/generate') generate(@Req() r:any,@Query('programId') p:string,@Param('weekNumber') w:string){return this.service.generateEvaluation(p,Number(w),r.user.id);}
  @Get(':weekNumber') get(@Req() r:any,@Query('programId') p:string,@Param('weekNumber') w:string){
    return this.db.weeklyEvaluation.findFirst({where:{programId:p,userId:r.user.id,weekNumber:Number(w)}});
  }
}
