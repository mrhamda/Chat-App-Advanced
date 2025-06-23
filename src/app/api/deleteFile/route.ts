import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

export const POST = async (req: NextRequest) => {
  try {
    const { messageID, txt } = await req.json();

    if (!messageID || !txt) {
      return NextResponse.json({ error: 'Message ID and text are required' }, { status: 400 });
    }

    // Assuming the txt field contains the relative path to the file
    const filePath = path.join(process.cwd(), 'public', txt);

    try {
      // Check if the file exists
      await fs.stat(filePath);  // This checks if the file exists

      // Delete the file
      await fs.unlink(filePath);

      console.log(`Deleted file: ${filePath}`);
    } catch (err) {
      // If the file doesn't exist, we can just log it
      console.log(`File not found: ${filePath}`);
    }

    // Optionally, handle updating the message status or deleting the message from the database
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to delete the file' }, { status: 500 });
  }
};
