import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/layout/Sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="min-h-screen bg-stone-50">
      <Sidebar user={session.user} />
      <main className="lg:ml-60 min-h-screen">
        <div className="max-w-5xl mx-auto px-6 py-8 pb-24 lg:pb-8">
          {children}
        </div>
      </main>
    </div>
  );
}
