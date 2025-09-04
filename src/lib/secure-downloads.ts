import { SignJWT } from 'jose';
import { nanoid } from 'nanoid';

const SECRET = new TextEncoder().encode(process.env.DOWNLOAD_LINK_SECRET || 'your-secret-key');

export async function generateSecureDownloadUrl(fileData: {
  fileId: string;
  fileName: string;
  bookId: string;
  orderReference: string;
}) {
  const token = await new SignJWT({
    ...fileData,
    downloadId: nanoid(),
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h') // Links expire after 24 hours
    .sign(SECRET);

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  return `${baseUrl}/download/${token}`;
}

export function getDownloadExpiration() {
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);
  return expiresAt;
}
