import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MoreVertical, ScanLine, Plus, Users } from 'lucide-react';
import { useGroupStore } from '@/stores/groupStore';
import { MemberAvatar } from '@/components/MemberAvatar';
import { ActivityItem } from '@/components/ActivityItem';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/constants';

export default function GroupDetail() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { groups, setActiveGroup } = useGroupStore();

  const group = groups.find(g => g.id === groupId);

  if (!group) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <p className="text-muted-foreground mb-4">Group not found</p>
        <Button onClick={() => navigate('/')}>Go to Dashboard</Button>
      </div>
    );
  }

  const handleScanPaint = () => {
    setActiveGroup(group.id);
    navigate('/scan');
  };

  // Mock expenses
  const expenses = [
    { description: 'Sushi Zen Restaurant', paidBy: 'Alex', date: 'Today', amount: 73.00, category: 'food' as const },
    { description: 'Uber to Temple', paidBy: 'Sarah', date: 'Yesterday', amount: 12.50, isOwed: false, category: 'transport' as const },
    { description: 'Street Food Tour', paidBy: 'You', date: '2 days ago', amount: 35.00, isOwed: false, category: 'food' as const },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground p-4 pb-20 safe-top">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <button className="p-2 -mr-2 rounded-lg hover:bg-white/10 transition-colors">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>

        <h1 className="text-2xl font-bold mb-1">{group.name}</h1>
        <p className="text-primary-foreground/70 mb-6">
          {group.members.length} members • {group.currency}
        </p>

        {/* Member Row */}
        <div className="flex items-center gap-3 overflow-x-auto pb-2">
          {group.members.map((member) => (
            <MemberAvatar
              key={member.id}
              name={member.name}
              colorHex={member.colorHex}
              size="lg"
              showName
            />
          ))}
          <button className="flex-shrink-0 w-12 h-12 rounded-full border-2 border-dashed border-primary-foreground/30 flex items-center justify-center text-primary-foreground/50 hover:border-primary-foreground hover:text-primary-foreground transition-colors">
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Stats Cards - overlapping header */}
      <div className="px-4 -mt-12">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card rounded-xl p-4 shadow-card">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Spend</p>
            <p className="text-xl font-bold text-foreground">
              {formatCurrency(group.totalSpend || 450.50, group.currency)}
            </p>
          </div>
          <div className="bg-card rounded-xl p-4 shadow-card">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Your Balance</p>
            <p className="text-xl font-bold text-success">
              +{formatCurrency(group.yourBalance || 120.00, group.currency)}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="p-4 space-y-6">
        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Button 
            onClick={handleScanPaint}
            className="h-auto py-4 flex-col gap-2"
          >
            <ScanLine className="w-5 h-5" />
            Scan & Paint
          </Button>
          <Button 
            variant="secondary"
            className="h-auto py-4 flex-col gap-2"
          >
            <Users className="w-5 h-5" />
            Settle Up
          </Button>
        </div>

        {/* Expenses */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-foreground">Recent Expenses</h2>
            <button className="text-sm text-accent font-medium hover:underline">
              View All
            </button>
          </div>

          <div className="space-y-2">
            {expenses.map((expense, index) => (
              <ActivityItem
                key={index}
                {...expense}
              />
            ))}
          </div>
        </section>

        {/* Balances */}
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">Balances</h2>
          <div className="space-y-3">
            {group.members.filter(m => !m.isAdmin).map((member) => {
              const balance = Math.random() > 0.5 ? 25 + Math.random() * 50 : -(10 + Math.random() * 30);
              const isOwed = balance > 0;
              
              return (
                <div key={member.id} className="flex items-center gap-3 p-3 bg-card rounded-xl">
                  <MemberAvatar
                    name={member.name}
                    colorHex={member.colorHex}
                    size="md"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{member.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {isOwed ? 'owes you' : 'you owe'}
                    </p>
                  </div>
                  <p className={`font-semibold ${isOwed ? 'text-success' : 'text-destructive'}`}>
                    {isOwed ? '+' : '-'}{formatCurrency(Math.abs(balance), group.currency)}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
