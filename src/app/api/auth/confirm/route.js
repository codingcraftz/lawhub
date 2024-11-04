import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/utils/supabaseAdmin";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");

  console.log("Starting OTP verification...");
  console.log("Token Hash:", token_hash);
  console.log("Type:", type);

  if (token_hash && type) {
    const { data, error } = await supabaseAdmin.auth.verifyOtp({
      type,
      token_hash,
    });

    if (error) {
      console.error("OTP verification failed:", error);
      return NextResponse.redirect(new URL("/error?error=otp", request.url));
    }

    console.log("OTP verification successful:", data);

    const userId = data.user.id;
    const newPassword = "qwer123456";

    console.log("Updating user password for user ID:", userId);
    const { error: updateError } =
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: newPassword,
      });

    if (updateError) {
      console.error("Temporary password update failed:", updateError);
      return NextResponse.redirect(new URL("/error?error=update", request.url));
    }

    console.log("Temporary password updated successfully for user ID:", userId);

    const successUrl = new URL("/password-auto-login", request.url);
    successUrl.searchParams.append("email", data.user.email);
    successUrl.searchParams.append("tempPassword", newPassword);
    return NextResponse.redirect(successUrl);
  }

  console.warn("Token hash or type missing in the request");
  return NextResponse.redirect(new URL("/error?error=missing", request.url));
}
