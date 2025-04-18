import { Injectable, OnModuleInit } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

interface UserSecret {
  wallet_address: string;
  password: string;
  salt: string;
  response_salt: string;
}

@Injectable()
export class SupabaseService implements OnModuleInit {
  private client: SupabaseClient;

  onModuleInit() {
    this.client = createClient(
      process.env.SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    );
  }

  getClient(): SupabaseClient {
    return this.client;
  }

  async getUserSecrets(walletAddress: string): Promise<UserSecret> {
    const response = (await this.client
      .from('user_secrets')
      .select('*')
      .eq('wallet_address', walletAddress)
      .single()) as { data: UserSecret; error: any };

    if (response.error) throw response.error;
    return response.data;
  }

  async updateUserSecrets(walletAddress: string, response_salt: string) {
    const { data, error } = await this.client
      .from('user_secrets')
      .update({ response_salt })
      .eq('wallet_address', walletAddress);

    if (error) throw error;
    return data;
  }
}
