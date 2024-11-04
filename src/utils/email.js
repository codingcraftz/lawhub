// src/utils/email.js

import nodemailer from "nodemailer";

export async function sendResetPasswordEmail(email, temporaryPassword) {
  const transporter = nodemailer.createTransport({
    host: "smtp-relay.sendinblue.com", // Brevo SMTP 서버
    port: 587,
    auth: {
      user: process.env.BREVO_EMAIL_USER, // Brevo 사용자 이메일
      pass: process.env.BREVO_API_KEY, // Brevo API 키
    },
  });

  const mailOptions = {
    from: process.env.BREVO_EMAIL_USER,
    to: email,
    subject: "비밀번호 재설정 요청",
    text: `임시 비밀번호는 "${temporaryPassword}"입니다. 로그인 후 비밀번호를 변경해주세요.`,
  };

  await transporter.sendMail(mailOptions);
}
