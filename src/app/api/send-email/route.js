// src/app/api/send-email/route.js

import nodemailer from "nodemailer";

export async function POST(request) {
  const { email, temporaryPassword } = await request.json();

  if (!email || !temporaryPassword) {
    return new Response(
      JSON.stringify({ error: "이메일과 임시 비밀번호가 필요합니다." }),
      { status: 400 },
    );
  }

  const transporter = nodemailer.createTransport({
    host: "smtp-relay.sendinblue.com",
    port: 587,
    auth: {
      user: process.env.BREVO_EMAIL_USER,
      pass: process.env.BREVO_API_KEY,
    },
  });

  const mailOptions = {
    from: process.env.BREVO_EMAIL_USER,
    to: email,
    subject: "임시 비밀번호 발급",
    text: `비밀번호가 초기화되었습니다. 임시 비밀번호는 "${temporaryPassword}"입니다. 로그인 후 비밀번호를 변경해주세요.`,
  };

  try {
    await transporter.sendMail(mailOptions);
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error("Error sending email:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
}
