import { BadRequestException, Body, Controller, Delete, Get, Param, Post, Query, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { randomUUID } from 'crypto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UploadProgressPhotoDto } from './progress-photo.dto';
import { ProgressPhotoService } from './progress-photo.service';

const allowed=new Set(['image/jpeg','image/png','image/webp']);
@Controller('progress-photos')
@UseGuards(JwtAuthGuard)
export class ProgressPhotoController {
  constructor(private service:ProgressPhotoService){}
  @Post()
  @UseInterceptors(FileInterceptor('photo',{
    storage:diskStorage({destination:process.env.UPLOAD_PATH||'./uploads',filename:(_,file,cb)=>cb(null,`${randomUUID()}${extname(file.originalname).toLowerCase()}`)}),
    limits:{fileSize:5*1024*1024},
    fileFilter:(_,file,cb)=>cb(null,allowed.has(file.mimetype)),
  }))
  upload(@Req()r:any,@UploadedFile()file:Express.Multer.File,@Body()dto:UploadProgressPhotoDto){if(!file)throw new BadRequestException('File foto JPEG, PNG, atau WebP maksimal 5 MB wajib diisi');return this.service.create(r.user.id,file,dto);}
  @Get('compare')compare(@Req()r:any,@Query('programId')p:string,@Query('week1')w1:string,@Query('week2')w2:string){return this.service.compare(r.user.id,p,Number(w1),Number(w2));}
  @Get()list(@Req()r:any,@Query('programId')p:string){return this.service.list(r.user.id,p);}
  @Delete(':id')remove(@Req()r:any,@Param('id')id:string){return this.service.remove(r.user.id,id);}
}
