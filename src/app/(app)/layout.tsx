import { AppShell } from "@/components/layout/app-shell";
import { StoreInitializer } from "@/components/store-initializer";
import { XmtpProvider } from "@/components/providers/xmtp-provider";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
      <StoreInitializer />
      <XmtpProvider>{children}</XmtpProvider>
    </AppShell>
  );
}
