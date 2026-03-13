import { Sidebar } from './Sidebar';
import { BottomTabs } from './BottomTabs';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex h-[100dvh] overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 min-h-0 overflow-y-auto pb-20 md:pb-0">
        {children}
      </main>
      <BottomTabs />
    </div>
  );
}
