// app/api/merge/route.js
import { supabaseAdmin } from "@/utils/supabaseAdmin";

export async function POST(request) {
  try {
    const { oldUserId, newUserId } = await request.json();
    if (!oldUserId || !newUserId) {
      return new Response("Missing oldUserId or newUserId.", { status: 400 });
    }

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

    const oldEmailIdToSave = oldUserId;
    const { error: emailUpdateErr } = await supabaseAdmin
      .from("users")
      .update({ email_id: oldEmailIdToSave })
      .eq("id", newUserId);
    if (emailUpdateErr) {
      console.error("emailUpdateErr:", emailUpdateErr);
      return new Response(
        emailUpdateErr.message || "Error updating email_id for new user",
        {
          status: 400,
        },
      );
    }

    const { error: dbDeleteErr } = await supabaseAdmin
      .from("users")
      .delete()
      .eq("id", oldUserId);

    if (dbDeleteErr) {
      console.error("dbDeleteErr:", dbDeleteErr);
      return new Response(
        dbDeleteErr.message || "Error deleting old user in DB",
        {
          status: 400,
        },
      );
    }
    const { error: authDeleteErr } =
      await supabaseAdmin.auth.admin.deleteUser(oldUserId);
    if (authDeleteErr) {
      console.error("authDeleteErr:", authDeleteErr);
      return new Response(
        authDeleteErr.message || "Error deleting old user in Auth",
        {
          status: 400,
        },
      );
    }

    return new Response("Merge completed successfully!", { status: 200 });
  } catch (err) {
    console.error("SERVER MERGE ERROR:", err);
    return new Response(err.message || "Unknown error", { status: 500 });
  }
}
