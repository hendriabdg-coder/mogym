import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { SaveFoodChecklistDto } from './food-checklist.dto';

@Injectable()
export class FoodChecklistService {
  constructor(private db: PrismaService) {}
  private range(offset=0){const start=new Date();start.setDate(start.getDate()+offset);start.setHours(0,0,0,0);const end=new Date(start);end.setDate(end.getDate()+1);return{start,end};}
  private async activeProgram(userId:string){const p=await this.db.cuttingProgram.findFirst({where:{userId,status:'ACTIVE'}});if(!p)throw new NotFoundException('Program aktif tidak ditemukan');return p;}
  async today(userId:string){
    const program=await this.activeProgram(userId),{start,end}=this.range();
    return this.db.foodChecklist.findFirst({where:{userId,programId:program.id,date:{gte:start,lt:end}}})??{userId,programId:program.id,date:start,items:[]};
  }
  async save(userId:string,dto:SaveFoodChecklistDto){
    const program=await this.activeProgram(userId),{start,end}=this.range();
    const current=await this.db.foodChecklist.findFirst({where:{userId,programId:program.id,date:{gte:start,lt:end}}});
    const items=dto.items.map(x=>({id:x.id||randomUUID(),name:x.name.trim(),consumed:x.consumed})).filter(x=>x.name);
    return current?this.db.foodChecklist.update({where:{id:current.id},data:{items}}):this.db.foodChecklist.create({data:{userId,programId:program.id,date:start,items}});
  }
  async toggle(userId:string,itemId:string,consumed:boolean){
    const list:any=await this.today(userId);if(!list.id)throw new NotFoundException('Checklist hari ini belum dibuat');
    const items=(list.items as any[]).map(x=>x.id===itemId?{...x,consumed}:x);
    if(!items.some(x=>x.id===itemId))throw new NotFoundException('Item tidak ditemukan');
    return this.db.foodChecklist.update({where:{id:list.id},data:{items}});
  }
  async copyYesterday(userId:string){
    const program=await this.activeProgram(userId),y=this.range(-1);
    const previous=await this.db.foodChecklist.findFirst({where:{userId,programId:program.id,date:{gte:y.start,lt:y.end}}});
    if(!previous)throw new NotFoundException('Checklist kemarin tidak ditemukan');
    return this.save(userId,{items:(previous.items as any[]).map(x=>({id:randomUUID(),name:x.name,consumed:false}))});
  }
}
