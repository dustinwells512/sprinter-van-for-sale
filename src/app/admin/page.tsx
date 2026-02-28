import { cookies } from "next/headers";
import LoginForm from "./LoginForm";
import AdminDashboard from "./AdminDashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session")?.value;
  const isAuthed = session && session === process.env.ADMIN_PASSWORD_HASH;

  if (!isAuthed) {
    return <LoginForm />;
  }

  return <AdminDashboard />;
}
