import { BadRequestException, Injectable } from '@nestjs/common';
import axios from 'axios';
import * as FormData from 'form-data';

interface PinataResponse {
  IpfsHash: string;
  PinSize: number;
  Timestamp: string;
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

@Injectable()
export class UploadService {
  async uploadToPinata(file: unknown): Promise<PinataResponse> {
    if (!isMulterFile(file)) {
      throw new BadRequestException('Invalid file object');
    }
    const buffer = (file as { buffer: Buffer }).buffer;
    const originalname = (file as { originalname: string }).originalname;
    const mimetype = (file as { mimetype: string }).mimetype;

    const formData = new FormData();
    formData.append('file', buffer, {
      filename: originalname,
      contentType: mimetype,
    });

    const res = await axios.post(
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

    return res.data as PinataResponse;
  }
}
