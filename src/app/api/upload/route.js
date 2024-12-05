export async function POST(request) {
  try {
    // 요청에서 파일 데이터를 가져옵니다.
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file) {
      return new Response(JSON.stringify({ message: "No file uploaded" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 파일 데이터를 Buffer로 변환
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // NGINX 업로드 서버로 전송 (multipart/form-data)
    const boundary = `----WebKitFormBoundary${Date.now().toString(16)}`;
    const body = `
--${boundary}
Content-Disposition: form-data; name="file"; filename="${file.name}"
Content-Type: ${file.type}

${buffer.toString()}
--${boundary}--`;

    const response = await fetch("http://211.44.133.202:3001/upload", {
      method: "POST",
      headers: {
        "Content-Type": `multipart/form-data; boundary=${boundary}`,
      },
      body: body,
    });

    if (!response.ok) {
      const errorData = await response.text();
      return new Response(
        JSON.stringify({
          message: "Failed to upload to NGINX server",
          error: errorData,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const result = await response.json();
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in API handler:", error);
    return new Response(
      JSON.stringify({
        message: "Internal server error",
        error: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
