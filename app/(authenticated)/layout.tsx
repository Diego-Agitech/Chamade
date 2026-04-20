import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AppHeader } from "@/components/shared/AppHeader";

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader
        user={{
          name: session.user.name ?? "Membre",
          email: session.user.email ?? "",
          color: session.user.color ?? "#3b82f6",
        }}
      />
      <main
        id="main-content"
        className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6"
      >
        {children}
      </main>
    </div>
  );
}
