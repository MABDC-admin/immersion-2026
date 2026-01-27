import { ReactNode } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { TopHeader } from './TopHeader';
import { ChatButton } from '@/components/chat/ChatButton';

interface MainLayoutProps {
  children: ReactNode;
  onAddNew?: () => void;
}

export function MainLayout({ children, onAddNew }: MainLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <TopHeader onAddNew={onAddNew} />
          <main className="flex-1 overflow-auto bg-background p-6">
            {children}
          </main>
        </div>
        <ChatButton />
      </div>
    </SidebarProvider>
  );
}
