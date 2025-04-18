import { Module } from '@nestjs/common';
import { SupabaseModule } from 'src/supabase/supabase.module';
import { CryptoService } from './crypto.service';

@Module({
  imports: [SupabaseModule],
  providers: [CryptoService],
  exports: [CryptoService],
})
export class CryptoModule {}
