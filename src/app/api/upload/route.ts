import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";

// Set the upload directory
const UPLOAD_DIR = path.resolve(process.cwd(), "public/uploads");

// Utility function to generate a unique name
const generateUniqueName = (originalName: string) => {
  const timestamp = Date.now(); // Current timestamp
  const extension = path.extname(originalName); // Extract the file extension
  return `file_${timestamp}${extension}`; // Combine timestamp and extension
};

export const POST = async (req: NextRequest) => {
  try {
    // Parse the form data to get the file
    const formData = await req.formData();
    const file = formData.get("file"); // Get the file directly from formData

    if (file && file instanceof Blob) {
      // Convert the file to a Buffer for saving
      const buffer = Buffer.from(await file.arrayBuffer());

      // Ensure the directory exists, if not, create it
      if (!fs.existsSync(UPLOAD_DIR)) {
        fs.mkdirSync(UPLOAD_DIR, { recursive: true });
      }

      const originalName = (file as File).name; // Get the original file name
      const generatedName = generateUniqueName(originalName); // Generate a unique name
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
