import { Link, useLocation } from 'react-router-dom';
import { Home, MessageSquare, Receipt, RefreshCw, User, Palette } from 'lucide-react';
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';

const navItems = [
    { icon: Home, label: 'Home', path: '/app' },
    { icon: MessageSquare, label: 'Groups', path: '/groups' },
    { icon: Receipt, label: 'Bills', path: '/bills' },
    { icon: RefreshCw, label: 'Settle', path: '/settle' },
    { icon: User, label: 'Account', path: '/account' },
];

export function AppSidebar() {
    const location = useLocation();

    return (
        <Sidebar collapsible="icon" className="border-r border-border">
            <SidebarHeader className="p-4">
                <Link to="/app" className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                        <Palette className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <span className="font-bold text-lg text-foreground group-data-[collapsible=icon]:hidden">
                        BillPaint
                    </span>
                </Link>
            </SidebarHeader>

            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {navItems.map(({ icon: Icon, label, path }) => {
                                const isActive = location.pathname === path ||
                                    (path !== '/app' && location.pathname.startsWith(path));

                                return (
                                    <SidebarMenuItem key={path}>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={isActive}
                                            tooltip={label}
                                        >
                                            <Link to={path}>
                                                <Icon className="w-5 h-5" />
                                                <span>{label}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                );
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>
    );
}
