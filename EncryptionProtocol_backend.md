# 🔐 Backend Encryption Protocol

This document outlines the backend-side responsibilities in the encryption protocol used by the **Content Vault** system. It ensures secure communication with the frontend, protects CID privacy, and prevents abuse of IPFS upload capabilities.

---

## 🧠 Overview

The backend is responsible for:

- Verifying requests based on user credentials
- Uploading files to IPFS via Pinata
- Encrypting the resulting CID using a secure protocol
- Returning the encrypted CID to the frontend

---

## 🛠 Flow Summary

1. **Receive Request**
   - `walletAddress`, `hashedDerivedKey`, and `file` are sent via `multipart/form-data`.

2. **Verify Identity**
   - Backend fetches the user’s stored `password` and `salt` from Supabase.
   - It recalculates `PBKDF2(password, salt)` and compares with `hashedDerivedKey`.

3. **IPFS Upload**
   - File is sent to Pinata’s `pinFileToIPFS` endpoint.
   - Returns a raw CID on success.

4. **Encrypt CID**
   - Retrieves or generates a `response_salt` for the user and stores it in Supabase.
   - Derives a new key: `PBKDF2(password, response_salt)`.
   - Encrypts CID using `AES-GCM` with a fresh IV.
   - The result is encoded as a hex string.

5. **Respond to Frontend**
   - Returns:
     ```json
     {
       "cidEncrypted": "0x...",
       "timestamp": "2025-04-15T14:32:00Z"
     }
     ```

---

## 🔐 Security Measures

- CID never returned in plaintext.
- Password and salts are never transmitted or exposed.
- PBKDF2 key derivation with 100,000 iterations (SHA-256).
- Encrypted CID is encoded in hex for safe smart contract payloads.

---

## 📦 Payload Format

Returned to frontend:
```json
{
  "cidEncrypted": "0xHEXSTRING",
  "timestamp": "ISO8601 string"
}
```

---

## 📁 Supabase Schema (`user_secrets`)

| Column         | Type    | Description                              |
|----------------|---------|------------------------------------------|
| wallet_address | `text`  | User’s wallet address (primary key)      |
| password       | `text`  | High-entropy password for encryption     |
| salt           | `text`  | Used for client-side hash verification   |
| response_salt  | `text`  | Used for CID encryption in the response  |

---

## 📥 Endpoint Specification

**POST** `/upload`

| Field             | Type     | Description                     |
|------------------|----------|---------------------------------|
| `walletAddress`  | `string` | User’s wallet                   |
| `hashedDerivedKey` | `string` | PBKDF2(password, salt) (hex)    |
| `file`           | `binary` | File to upload to IPFS         |

---

## 🧪 Example Code (NestJS)

```ts
@Post()
@UseInterceptors(FileInterceptor('file'))
async uploadFile(
  @UploadedFile() file: Express.Multer.File,
  @Body() body: { walletAddress: string; hashedDerivedKey: string }
) {
  return this.uploadService.uploadToPinata(file, body.walletAddress, body.hashedDerivedKey);
}
```

---

For frontend protocol documentation, refer to the [Frontend Encryption Protocol](../lib/crypto/README.md).