import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

export const POST = async (req: NextRequest) => {
  try {
    const { messageID, txt } = await req.json();

    if (!messageID || !txt) {
      return NextResponse.json({ error: 'Message ID and text are required' }, { status: 400 });
    }

    const filePath = path.join(process.cwd(), 'public', txt);

    try {
      await fs.stat(filePath); 

      await fs.unlink(filePath);

      console.log(`Deleted file: ${filePath}`);
    } catch (err) {
      console.log(`File not found: ${filePath}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to delete the file' }, { status: 500 });
  }
};
