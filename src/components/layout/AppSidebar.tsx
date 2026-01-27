import { Link, useLocation } from 'react-router-dom';
import { Home, MessageSquare, Receipt, RefreshCw, User } from 'lucide-react';
import equiLogo from "@/assets/equi-logo.png";
import { useGroupStore } from '@/stores/groupStore';
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
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
    const { getActiveGroup } = useGroupStore();
    const activeGroup = getActiveGroup();

    return (
        <Sidebar collapsible="icon" className="border-r border-border">
            <SidebarHeader className="p-4">
                <Link to="/" className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
                    <img src={equiLogo} alt="Equi" className="w-8 h-8 object-contain" />
                    <span className="font-bold text-lg text-foreground group-data-[collapsible=icon]:hidden">
                        Equi
                    </span>
                </Link>
            </SidebarHeader>

            <SidebarContent>
                {activeGroup && (
                    <SidebarGroup>
                        <SidebarGroupLabel>Active Trip</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                <SidebarMenuItem>
                                    <SidebarMenuButton asChild tooltip={activeGroup.name} className="h-auto py-3">
                                        <Link to={`/group/${activeGroup.id}`} className="flex items-center gap-3">
                                            <div
                                                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm shrink-0"
                                                style={{ backgroundColor: activeGroup.members.find(m => m.isAdmin)?.colorHex || '#6B7B5F' }}
                                            >
                                                {activeGroup.name.substring(0, 2).toUpperCase()}
                                            </div>
                                            <div className="flex flex-col gap-0.5 overflow-hidden text-left">
                                                <span className="font-medium truncate leading-none">{activeGroup.name}</span>
                                                <span className="text-xs text-muted-foreground truncate">{activeGroup.members.length} members</span>
                                            </div>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                )}

                <SidebarGroup>
                    <SidebarGroupLabel>Menu</SidebarGroupLabel>
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
