import { Sidebar } from './Sidebar';
import { BottomTabs } from './BottomTabs';

interface AppShellProps {
  children: React.ReactNode;
  hideSidebar?: boolean;
}

export function AppShell({ children, hideSidebar = false }: AppShellProps) {
  return (
    <div className="flex h-[100dvh] overflow-hidden bg-background">
      {!hideSidebar && <Sidebar />}
      <main role="main" className="flex-1 min-h-0 overflow-y-auto pb-20 md:pb-0">
        {children}
      </main>
      {!hideSidebar && <BottomTabs />}
    </div>
  );
}
