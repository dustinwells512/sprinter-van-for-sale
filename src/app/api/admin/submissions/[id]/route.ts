import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSupabase } from "@/app/lib/supabase";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Auth check
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session")?.value;
  if (!session || session !== process.env.ADMIN_PASSWORD_HASH) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { status, notes, risk } = await req.json();

  const supabase = getSupabase();

  // Upsert into submission_meta
  const upsertData: Record<string, unknown> = {
    submission_id: id,
    site_id: "sprinter-van",
    status: status || "new",
    notes: notes ?? null,
  };
  if (risk !== undefined) {
    upsertData.risk_override = risk || null;
  }

  const { error } = await supabase
    .schema("forms")
    .from("submission_meta")
    .upsert(upsertData, { onConflict: "submission_id" });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session")?.value;
  if (!session || session !== process.env.ADMIN_PASSWORD_HASH) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const supabase = getSupabase();

  // Delete meta first (or let CASCADE handle it), then the submission
  await supabase
    .schema("forms")
    .from("submission_meta")
    .delete()
    .eq("submission_id", id);

  const { error } = await supabase
    .schema("forms")
    .from("submissions")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
