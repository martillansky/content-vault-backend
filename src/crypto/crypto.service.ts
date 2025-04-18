import { BadRequestException, Injectable } from '@nestjs/common';
import { CID } from 'multiformats';
import { SupabaseService } from 'src/supabase/supabase.service';

// Define a type for the CID module
type CIDModule = {
  parse: (cidStr: string) => { bytes: Uint8Array };
};

@Injectable()
export class CryptoService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async validateHash(
    hashedDerivedKey: string,
    walletAddress: string,
  ): Promise<string> {
    const user = await this.supabaseService.getUserSecrets(walletAddress);

    const newDerivedKey: string = await this.deriveHashKey(
      user.password,
      user.salt,
    );

    if (newDerivedKey !== hashedDerivedKey) {
      throw new BadRequestException('Invalid hashed derived key');
    }

    const response_salt = this.generateSalt();
    await this.supabaseService.updateUserSecrets(walletAddress, response_salt);

    const responseHashedDerivedKey: string = await this.deriveHashKey(
      user.password,
      response_salt,
    );

    return responseHashedDerivedKey;
  }

  async encryptCIDToHex(cidStr: string, password: string): Promise<string> {
    // Convert the CID string to a Uint8Array
    const cidBytes = this.cidStringToBytes(cidStr);

    // Generate a random salt
    const salt = crypto.getRandomValues(new Uint8Array(16));

    // Derive a key from the password and salt
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveKey'],
    );

    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt'],
    );

    // Generate a random IV
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // Encrypt the CID bytes
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      cidBytes,
    );

    // Concatenate salt, IV, and ciphertext
    const encryptedBytes = new Uint8Array([
      ...salt,
      ...iv,
      ...new Uint8Array(encrypted),
    ]);

    return this.bytesToHex(encryptedBytes);
  }

  bytesToHex(bytes: Uint8Array): string {
    return (
      '0x' +
      Array.from(bytes)
        .map((byte) => byte.toString(16).padStart(2, '0'))
        .join('')
    );
  }

  cidStringToBytes(cidStr: string): Uint8Array {
    const cidModule = CID as unknown as CIDModule;
    let cid: { bytes: Uint8Array };
    try {
      cid = cidModule.parse(cidStr) as { bytes: Uint8Array };
    } catch {
      throw new BadRequestException('Invalid CID format');
    }
    return cid.bytes;
  }

  simpleCIDToHex(cidStr: string): string {
    const cidBytes = this.cidStringToBytes(cidStr);

    return this.bytesToHex(cidBytes);
  }

  async encodeCID(
    cid: string,
    useEncryption: boolean,
    walletAddress: string,
  ): Promise<string> {
    return useEncryption
      ? await this.encryptCIDToHex(cid, walletAddress)
      : this.simpleCIDToHex(cid);
  }

  async deriveHashKey(password: string, salt: string): Promise<string> {
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveBits'],
    );

    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: new TextEncoder().encode(salt),
        iterations: 100_000,
        hash: 'SHA-256',
      },
      keyMaterial,
      256, // 256 bits = 32 bytes
    );

    return Array.from(new Uint8Array(derivedBits))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  generateSalt(): string {
    const saltBytes = crypto.getRandomValues(new Uint8Array(16)); // 128-bit salt
    return Array.from(saltBytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join(''); // 32-character hex string
  }
}
