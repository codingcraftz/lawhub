import { NextResponse } from "next/server";

export async function GET() {
  const nginxFileListUrl = "http://203.0.113.1:3001/uploads";
  const response = await fetch(nginxFileListUrl);

  if (!response.ok) {
    return NextResponse.json(
      { message: "Failed to fetch file list" },
      { status: 500 },
    );
  }

  const fileList = await response.json();
  return NextResponse.json(fileList);
}
