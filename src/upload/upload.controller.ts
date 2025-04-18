import {
  Body,
  Controller,
  Post,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { UploadService } from './upload.service';

interface UploadRequestBody {
  walletAddress: string;
  hashedDerivedKey: string;
  file: Express.Multer.File;
  useEncryption: string;
}

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
  ) {
    const body = req.body as UploadRequestBody;
    const useEncryption = body.useEncryption === 'true';

    return this.uploadService.uploadToPinata(
      file,
      body.walletAddress,
      body.hashedDerivedKey,
      useEncryption,
    );
  }
}
