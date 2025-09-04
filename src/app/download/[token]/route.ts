import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

const SECRET = new TextEncoder().encode(
  process.env.DOWNLOAD_LINK_SECRET || 'your-secret-key'
);

export async function GET(
  request: Request,
  { params }: { params: { token: string } }
) {
  try {
    // Verify the JWT token
    const { payload } = await jwtVerify(params.token, SECRET);
    
    // Get the book details to verify the file exists
    const bookRef = doc(db, 'books', payload.bookId as string);
    const bookSnap = await getDoc(bookRef);
    
    if (!bookSnap.exists()) {
      return new NextResponse('File not found', { status: 404 });
    }

    const book = bookSnap.data();
    const fileUrl = book.digitalFile?.url;

    if (!fileUrl) {
      return new NextResponse('Digital file not available', { status: 404 });
    }

    // Log the download for analytics
    // await recordDownload({
    //   bookId: payload.bookId as string,
    //   orderReference: payload.orderReference as string,
    //   downloadId: payload.downloadId as string,
    //   timestamp: new Date().toISOString()
    // });

    // Redirect to the actual file URL
    // In production, you might want to stream the file through your server
    // or use signed URLs from your storage provider
    return NextResponse.redirect(fileUrl);
  } catch (error) {
    console.error('Download error:', error);
    return new NextResponse('Invalid or expired download link', { status: 403 });
  }
}
