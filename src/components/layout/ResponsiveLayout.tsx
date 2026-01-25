import { Outlet } from 'react-router-dom';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { BottomNav } from '@/components/BottomNav';
import { useIsMobile } from '@/hooks/use-mobile';

export function ResponsiveLayout() {
    const isMobile = useIsMobile();

    // On mobile, show the traditional bottom nav layout
    if (isMobile) {
        return (
            <div className="min-h-screen bg-background">
                <Outlet />
                <BottomNav />
            </div>
        );
    }

    // On desktop, show sidebar layout
    return (
        <SidebarProvider defaultOpen={true}>
            <AppSidebar />
            <SidebarInset>
                <header className="sticky top-0 z-40 flex h-14 items-center gap-2 border-b border-border bg-background/80 backdrop-blur-md px-4 md:hidden">
                    <SidebarTrigger />
                </header>
                <div className="flex-1">
                    <Outlet />
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
