import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { promises as fs } from 'fs';
import { resolve } from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { UploadProgressPhotoDto } from './progress-photo.dto';

@Injectable()
export class ProgressPhotoService {
  constructor(private db:PrismaService,private config:ConfigService){}
  private async program(userId:string,programId?:string){const p=await this.db.cuttingProgram.findFirst({where:{userId,...(programId?{id:programId}:{status:'ACTIVE'})}});if(!p)throw new NotFoundException('Program tidak ditemukan');return p;}
  async create(userId:string,file:Express.Multer.File,dto:UploadProgressPhotoDto){
    const program=await this.program(userId);
    return this.db.progressPhoto.create({data:{userId,programId:program.id,weekNumber:dto.weekNumber,angle:dto.angle,photoUrl:`/uploads/${file.filename}`,takenAt:new Date()}});
  }
  async list(userId:string,programId:string){await this.program(userId,programId);return this.db.progressPhoto.findMany({where:{userId,programId},orderBy:[{weekNumber:'desc'},{angle:'asc'}]});}
  async remove(userId:string,id:string){
    const photo=await this.db.progressPhoto.findFirst({where:{id,userId}});if(!photo)throw new NotFoundException('Foto tidak ditemukan');
    await this.db.progressPhoto.delete({where:{id}});
    const uploadRoot=resolve(this.config.get('UPLOAD_PATH','./uploads'));const file=resolve(uploadRoot,photo.photoUrl.split('/').pop()!);
    if(file.startsWith(uploadRoot))await fs.unlink(file).catch(()=>undefined);
    return{message:'Foto progres dihapus'};
  }
  async compare(userId:string,programId:string,week1:number,week2:number){await this.program(userId,programId);const photos=await this.db.progressPhoto.findMany({where:{userId,programId,weekNumber:{in:[week1,week2]}},orderBy:{angle:'asc'}});return{week1:photos.filter(x=>x.weekNumber===week1),week2:photos.filter(x=>x.weekNumber===week2)};}
}
