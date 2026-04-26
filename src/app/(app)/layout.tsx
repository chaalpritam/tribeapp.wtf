import { AppShell } from "@/components/layout/app-shell";
import { StoreInitializer } from "@/components/store-initializer";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
      <StoreInitializer />
      {children}
    </AppShell>
  );
}
