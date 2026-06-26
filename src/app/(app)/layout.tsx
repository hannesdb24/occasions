import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/layout/Sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col md:flex-row">
      <Sidebar user={session.user} />
      <main className="flex-1 pb-24 md:pb-0 min-h-screen">
        <div className="max-w-5xl mx-auto p-6 md:p-10 w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
