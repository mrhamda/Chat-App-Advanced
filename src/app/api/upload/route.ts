import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";

const UPLOAD_DIR = path.resolve(process.cwd(), "public/uploads");

const generateUniqueName = (originalName: string) => {
  const timestamp = Date.now(); 
  const extension = path.extname(originalName); 
  return `file_${timestamp}${extension}`; 
};

export const POST = async (req: NextRequest) => {
  try {
    const formData = await req.formData();
    const file = formData.get("file"); 

    if (file && file instanceof Blob) {
      const buffer = Buffer.from(await file.arrayBuffer());

      if (!fs.existsSync(UPLOAD_DIR)) {
        fs.mkdirSync(UPLOAD_DIR, { recursive: true });
      }

      const originalName = (file as File).name; 
      const generatedName = generateUniqueName(originalName); 
      const filePath = path.resolve(UPLOAD_DIR, generatedName);

      fs.writeFileSync(filePath, buffer);

      return NextResponse.json({
        success: true,
        name: generatedName,
        filePath: `/uploads/${generatedName}`,
      });
    } else {
      return NextResponse.json({
        success: false,
        message: "No file uploaded or invalid file type.",
      });
    }
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json({
      success: false,
      message: "Error uploading file.",
    });
  }
};
