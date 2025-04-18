import { BadRequestException, Injectable } from '@nestjs/common';
import axios from 'axios';
import * as FormData from 'form-data';
import { CryptoService } from 'src/crypto/crypto.service';

export interface UploadResponse {
  IpfsHash: string;
  ReturnedHashedDerivedKey: string;
  MimeType: string;
  Name: string;
  timestamp: string;
}

interface PinataResponse {
  IpfsHash: string;
}

function isMulterFile(file: unknown): file is Express.Multer.File {
  if (!file || typeof file !== 'object') return false;
  const f = file as Record<string, unknown>;
  return (
    typeof f.originalname === 'string' &&
    Buffer.isBuffer(f.buffer) &&
    typeof f.mimetype === 'string'
  );
}

async function ipfsUploadFile(file: unknown) {
  if (!isMulterFile(file)) {
    throw new BadRequestException('Invalid file object');
  }

  const buffer = file.buffer;
  const originalname = file.originalname;
  const mimetype = file.mimetype;

  const formData = new FormData();
  formData.append('file', buffer, {
    filename: originalname,
    contentType: mimetype,
  });

  const res = await axios.post<PinataResponse>(
    'https://api.pinata.cloud/pinning/pinFileToIPFS',
    formData,
    {
      maxBodyLength: Infinity,
      headers: {
        ...formData.getHeaders(),
        pinata_api_key: process.env.PINATA_API_KEY ?? '',
        pinata_secret_api_key: process.env.PINATA_SECRET_API_KEY ?? '',
      },
    },
  );

  const cid = res.data.IpfsHash;
  return { buffer, originalname, mimetype, cid };
}

@Injectable()
export class UploadService {
  constructor(private readonly cryptoService: CryptoService) {}

  async uploadToPinata(
    walletAddress: string,
    hashedDerivedKey: string,
    file: unknown,
    useEncryption: boolean,
  ): Promise<UploadResponse> {
    const responseHashedDerivedKey: string =
      await this.cryptoService.validateHash(hashedDerivedKey, walletAddress);

    if (!responseHashedDerivedKey) {
      throw new BadRequestException('Invalid hashed derived key');
    }

    const { originalname, mimetype, cid } = await ipfsUploadFile(file);

    const IpfsHash = await this.cryptoService.encodeCID(
      cid,
      useEncryption,
      walletAddress,
    );

    const timestamp = new Date().toISOString();

    return {
      IpfsHash,
      ReturnedHashedDerivedKey: responseHashedDerivedKey,
      MimeType: mimetype,
      Name: originalname,
      timestamp,
    };
  }
}
