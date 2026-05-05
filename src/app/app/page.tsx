import { auth } from "@/auth";
import AppShell from '@/components/AppShell';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export default async function Home() {
  const session = await auth();
  return <AppShell session={session} />;
}
