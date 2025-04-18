import { Module } from '@nestjs/common';
import { CryptoModule } from 'src/crypto/crypto.module';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';

@Module({
  imports: [CryptoModule],
  controllers: [UploadController],
  providers: [UploadService],
})
export class UploadModule {}
