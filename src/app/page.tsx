import { auth } from "@/auth";
import AppShell from '@/components/AppShell';

export default async function Home() {
  const session = await auth();
  return <AppShell session={session} />;
}
