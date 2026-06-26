import { redirect } from "next/navigation";

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  // Einfach zur Registrierung weiterleiten mit Token
  redirect(`/register?token=${token}`);
}
