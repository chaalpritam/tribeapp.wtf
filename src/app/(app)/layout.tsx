import { AppShell } from "@/components/layout/app-shell";
import { RequireAuth } from "@/components/auth/require-auth";
import { StoreInitializer } from "@/components/store-initializer";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <AppShell>
        <StoreInitializer />
        {children}
      </AppShell>
    </RequireAuth>
  );
}
