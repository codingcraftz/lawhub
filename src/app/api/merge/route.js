// app/api/merge/route.js
import { createClient } from "@supabase/supabase-js";

export async function POST(request) {
  try {
    const { oldUserId, newUserId } = await request.json();
    if (!oldUserId || !newUserId) {
      return new Response("Missing oldUserId or newUserId.", { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY, // Admin 권한 키
    );

    const { data: oldUserRow, error: oldUserErr } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("id", oldUserId)
      .single();

    if (oldUserErr) {
      console.error("oldUserErr:", oldUserErr);
      return new Response(oldUserErr.message || "Error fetching old user", {
        status: 400,
      });
    }

    const { data: newUserRow, error: newUserErr } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("id", newUserId)
      .single();

    if (newUserErr) {
      console.error("newUserErr:", newUserErr);
      return new Response(newUserErr.message || "Error fetching new user", {
        status: 400,
      });
    }

    if (!oldUserRow) {
      return new Response("oldUser does not exist in DB", { status: 404 });
    }
    if (!newUserRow) {
      return new Response("newUser does not exist in DB", { status: 404 });
    }
    const tableList = [
      { name: "case_timelines", column: "created_by" },
      { name: "case_timelines", column: "requested_to" },
      { name: "requests", column: "requester_id" },
      { name: "requests", column: "receiver_id" },
      { name: "request_comments", column: "user_id" },
      { name: "notifications", column: "user_id" },
      { name: "comment_reactions", column: "user_id" },
      { name: "todos", column: "user_id" },
      { name: "case_staff", column: "staff_id" },
      { name: "case_clients", column: "client_id" },
    ];

    for (const t of tableList) {
      const { error: updateErr } = await supabaseAdmin
        .from(t.name)
        .update({ [t.column]: newUserId })
        .eq(t.column, oldUserId);

      if (updateErr) {
        console.error(
          `Error updating ${t.name}.${t.column} from ${oldUserId} to ${newUserId}:`,
          updateErr,
        );
        return new Response(updateErr.message || "DB update error", {
          status: 400,
        });
      }
    }

    // const phoneToSave =
    //   oldUserRow?.phone_number || newUserRow?.phone_number || "";
    // const { error: newUserUpdateErr } = await supabaseAdmin
    //   .from("users")
    //   .update({
    //     phone_number: phoneToSave,
    //     is_kakao_user: true, // 병합된 계정은 kakao_user로 설정
    //     role: newUserRow.role || "client", // role이 없다면 client로
    //   })
    //   .eq("id", newUserId);
    //
    // if (newUserUpdateErr) {
    //   console.error("newUserUpdateErr:", newUserUpdateErr);
    //   return new Response(
    //     newUserUpdateErr.message || "Error updating new user",
    //     {
    //       status: 400,
    //     },
    //   );
    // }

    const { error: deleteErr } = await supabaseAdmin
      .from("users")
      .update({ is_kakao_user: "TRUE" })
      .eq("id", oldUserId);

    if (deleteErr) {
      console.error("deleteErr:", deleteErr);
      return new Response(deleteErr.message || "Error deleting old user", {
        status: 400,
      });
    }

    // (선택) Auth 레벨에서 oldUser 삭제하기
    //  -> Supabase Management API 사용
    //     await supabaseAdmin.auth.admin.deleteUser(oldUserId);
    //     (단, deleteUser()는 JS 라이브러리에선 2023년 9월 현재 Beta/알파 단계이므로 문서 확인)

    return new Response("Merge completed successfully!", { status: 200 });
  } catch (err) {
    console.error("SERVER MERGE ERROR:", err);
    return new Response(err.message || "Unknown error", { status: 500 });
  }
}
