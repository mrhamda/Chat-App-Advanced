import { NextResponse } from 'next/server'; // Use NextResponse for Next.js 13+
import { PeerServer } from 'peer';

// TypeScript types for request and response
export async function GET() {
  const peerServer = PeerServer({
    port: 9000,
    path: '/myapp',
  });

  peerServer.on('listening', () => {
    console.log('PeerJS server is running on ws://localhost:9000/myapp');
  });

  peerServer.on('error', (err: Error) => {
    console.error('PeerJS error:', err);
  });

  return NextResponse.json({ message: 'PeerJS server started' });
}
