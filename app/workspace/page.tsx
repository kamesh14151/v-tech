import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { WorkspaceLayout } from "@/components/workspace/workspace-layout";
import { query } from "@/lib/db";

export default async function WorkspacePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // If the user has an old session with a UUID instead of an integer DB ID, force a re-login
  // This prevents postgres crash "invalid input syntax for type integer: 'bc7e...'"
  if (session.user.id && isNaN(Number(session.user.id))) {
    // Redirect to a clear session or login route
    redirect("/api/auth/signin");
  }

  return (
    <WorkspaceLayout
      user={{
        name: session.user.name || "User",
        email: session.user.email || "",
        image: session.user.image || "",
        id: session.user.id || "",
      }}
      isNewUser={false}
    />
  );
}
