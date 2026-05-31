import { TRPCProvider } from "../../lib/trpc-provider";

export default function OnboardingLayout({ children }: { children: React.ReactNode }): React.ReactNode {
  return (
    <TRPCProvider>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        {children}
      </div>
    </TRPCProvider>
  );
}
