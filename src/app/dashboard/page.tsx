import { auth } from "@/auth";
import AppShell from '@/components/AppShell';

export const dynamic = 'force-dynamic';

export default async function Dashboard() {
  const session = await auth();
  return <AppShell session={session} />;
}
