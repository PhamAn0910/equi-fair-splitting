import { BottomNav } from '@/components/BottomNav';
import { MemberAvatar } from '@/components/MemberAvatar';
import { Settings, Bell, CreditCard, HelpCircle, LogOut, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Account() {
  const navigate = useNavigate();
  
  const menuItems = [
    { icon: Settings, label: 'Settings', description: 'App preferences', path: '/settings' },
    { icon: Bell, label: 'Notifications', description: 'Manage alerts', path: null },
    { icon: CreditCard, label: 'Payment Methods', description: 'Add or remove', path: null },
    { icon: HelpCircle, label: 'Help & Support', description: 'Get assistance', path: null },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="px-4 pt-6 pb-6 safe-top">
        <div className="flex items-center gap-4">
          <MemberAvatar name="Shinomiya" colorHex="#6B7B5F" size="xl" />
          <div>
            <h1 className="text-xl font-bold text-foreground">Shinomiya</h1>
            <p className="text-muted-foreground">shinomiya@email.com</p>
          </div>
        </div>
      </header>

      <main className="px-4 space-y-2">
        {menuItems.map(({ icon: Icon, label, description, path }) => (
          <button
            key={label}
            onClick={() => path && navigate(path)}
            className="w-full flex items-center gap-4 p-4 bg-card rounded-xl hover:bg-muted transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
              <Icon className="w-5 h-5 text-foreground" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-foreground">{label}</p>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        ))}

        <button className="w-full flex items-center gap-4 p-4 bg-card rounded-xl hover:bg-destructive/10 transition-colors mt-6">
          <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
            <LogOut className="w-5 h-5 text-destructive" />
          </div>
          <div className="flex-1 text-left">
            <p className="font-medium text-destructive">Sign Out</p>
          </div>
        </button>
      </main>

      <BottomNav />
    </div>
  );
}
