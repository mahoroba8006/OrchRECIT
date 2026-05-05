import { auth } from "@/auth";
import AppShell from '@/components/AppShell';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export default async function Home() {
  await headers();
  const session = await auth();
  return <AppShell session={session} />;
}
