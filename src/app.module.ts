import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UploadModule } from './upload/upload.module';
import { CryptoModule } from './crypto/crypto.module';
import { SupabaseModule } from './supabase/supabase.module';

@Module({
  imports: [UploadModule, CryptoModule, SupabaseModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
