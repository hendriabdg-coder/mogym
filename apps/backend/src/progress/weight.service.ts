import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LogWeightDto } from './weight.dto';

@Injectable()
export class WeightService {
  constructor(private db: PrismaService) {}

  private async ownedProgram(programId: string, userId: string) {
    const program = await this.db.cuttingProgram.findFirst({ where: { id: programId, userId } });
    if (!program) throw new NotFoundException('Program tidak ditemukan');
    return program;
  }

  async log(userId: string, programId: string, dto: LogWeightDto) {
    const program = await this.ownedProgram(programId, userId);
    const weighDate = new Date(dto.date);
    if (weighDate > new Date(Date.now() + 86_400_000)) throw new BadRequestException('Tanggal timbang tidak boleh di masa depan');
    const weekNumber = Math.max(1, Math.floor((weighDate.getTime() - program.startDate.getTime()) / 604_800_000) + 1);
    const entry = await this.db.weeklyWeight.create({ data: { userId, programId, weekNumber, weighDate, weightKg: dto.weightKg, bodyFatPercent: dto.bodyFatPercent, notes: dto.notes } });
    await this.db.cuttingProgram.update({ where: { id: programId }, data: { currentWeight: dto.weightKg } });
    return entry;
  }

  async history(userId: string, programId: string) {
    await this.ownedProgram(programId, userId);
    const entries = await this.db.weeklyWeight.findMany({ where: { userId, programId }, orderBy: { weighDate: 'asc' } });
    const first = entries[0]?.weightKg;
    return {
      entries,
      trend: entries.map((entry, index) => ({
        ...entry,
        changeFromPrevious: index ? Number((entry.weightKg - entries[index - 1].weightKg).toFixed(2)) : 0,
        changeFromStart: first == null ? 0 : Number((entry.weightKg - first).toFixed(2)),
      })),
    };
  }

  async latest(userId: string, programId: string) {
    await this.ownedProgram(programId, userId);
    return this.db.weeklyWeight.findFirst({ where: { userId, programId }, orderBy: { weighDate: 'desc' } });
  }
}
