import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { supabaseAdmin } from "@/utils/supabaseAdmin";

// authOptions 가져오기
const getAuthOptions = () => {
  return {
    providers: [
      {
        id: "kakao",
        name: "Kakao",
      },
    ],
    secret: process.env.NEXTAUTH_SECRET || "lawhubnextauthsecret",
  };
};

export async function PUT(request) {
  try {
    // 세션 확인 (authOptions 포함)
    const session = await getServerSession(getAuthOptions());
    if (!session || !session.user) {
      return NextResponse.json({ error: "인증되지 않은 요청입니다." }, { status: 401 });
    }

    // 요청 데이터 가져오기
    const data = await request.json();

    // 사용자 ID 가져오기
    const userEmail = session.user.email;

    // 먼저 사용자 조회
    const { data: userData, error: userError } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("email", userEmail)
      .single();

    if (userError) {
      console.error("사용자 조회 오류:", userError);
      return NextResponse.json({ error: "사용자를 찾을 수 없습니다." }, { status: 404 });
    }

    // 업데이트할 데이터 필터링 (허용된 필드만)
    const allowedFields = [
      "name",
      "nickname",
      "phone_number",
      "birth_date",
      "gender",
      "profile_image",
      "position",
    ];

    const filteredData = Object.keys(data)
      .filter((key) => allowedFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = data[key];
        return obj;
      }, {});

    // 사용자 정보 업데이트
    const { data: updatedUser, error: updateError } = await supabaseAdmin
      .from("users")
      .update(filteredData)
      .eq("id", userData.id)
      .select()
      .single();

    if (updateError) {
      console.error("사용자 업데이트 오류:", updateError);
      return NextResponse.json({ error: "프로필 업데이트에 실패했습니다." }, { status: 500 });
    }

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("서버 오류:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
