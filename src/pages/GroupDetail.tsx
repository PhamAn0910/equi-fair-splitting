import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MoreVertical, ScanLine, Plus, Users, Receipt, UserPlus } from 'lucide-react';
import { useGroupStore } from '@/stores/groupStore';
import { useExpenseStore } from '@/stores/expenseStore';
import { MemberAvatar } from '@/components/MemberAvatar';
import { ActivityItem } from '@/components/ActivityItem';
import { Button } from '@/components/ui/button';
import { AddExpenseDialog } from '@/components/AddExpenseDialog';
import { AddMemberDialog } from '@/components/AddMemberDialog';
import { formatCurrency } from '@/lib/constants';

export default function GroupDetail() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { groups, setActiveGroup } = useGroupStore();
  const { getExpensesByGroup, getGroupBalances, getGroupTotalSpend } = useExpenseStore();

  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);

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

  const expenses = getExpensesByGroup(group.id);
  const balances = getGroupBalances(group.id);
  const totalSpend = getGroupTotalSpend(group.id);

  // Get admin balance (You)
  const admin = group.members.find(m => m.isAdmin);
  const yourBalance = admin ? balances[admin.id] || 0 : 0;

  // Format date for display
  const formatExpenseDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

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
          {group.members.length} members
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
          <button 
            onClick={() => setShowAddMember(true)}
            className="flex-shrink-0 w-12 h-12 rounded-full border-2 border-dashed border-primary-foreground/30 flex items-center justify-center text-primary-foreground/50 hover:border-primary-foreground hover:text-primary-foreground transition-colors"
          >
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
              {formatCurrency(totalSpend, group.currency)}
            </p>
          </div>
          <div className="bg-card rounded-xl p-4 shadow-card">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Your Balance</p>
            <p 
              className="text-xl font-bold"
              style={{ color: yourBalance >= 0 ? '#7b8763' : 'rgb(231, 110, 80)' }}
            >
              {yourBalance >= 0 ? '+' : ''}{formatCurrency(yourBalance, group.currency)}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="p-4 space-y-6">
        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-3">
          <Button 
            onClick={handleScanPaint}
            className="h-auto py-4 flex-col gap-2"
          >
            <ScanLine className="w-5 h-5" />
            Scan
          </Button>
          <Button 
            variant="secondary"
            onClick={() => setShowAddExpense(true)}
            className="h-auto py-4 flex-col gap-2"
          >
            <Receipt className="w-5 h-5" />
            Add
          </Button>
          <Button 
            variant="secondary"
            onClick={() => navigate('/settle')}
            className="h-auto py-4 flex-col gap-2"
          >
            <Users className="w-5 h-5" />
            Settle
          </Button>
        </div>

        {/* Expenses */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-foreground">
              Expenses ({expenses.length})
            </h2>
            <button 
              onClick={() => navigate('/bills')}
              className="text-sm text-accent font-medium hover:underline"
            >
              View All
            </button>
          </div>

          {expenses.length > 0 ? (
            <div className="space-y-2">
              {expenses.slice(0, 5).map((expense) => {
                const payer = group.members.find(m => m.id === expense.payerId);
                return (
                  <div
                    key={expense.id}
                    onClick={() => navigate(`/bill/${expense.id}`)}
                    className="cursor-pointer hover:bg-muted/50 rounded-xl transition-colors"
                  >
                    <ActivityItem
                      description={expense.description}
                      paidBy={payer?.name || 'Unknown'}
                      date={formatExpenseDate(expense.date)}
                      amount={expense.totalAmount}
                      category={expense.category}
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            <div 
              onClick={() => setShowAddExpense(true)}
              className="border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
            >
              <Receipt className="w-8 h-8 text-muted-foreground mb-2" />
              <p className="font-medium text-foreground">No expenses yet</p>
              <p className="text-sm text-muted-foreground">Tap to add your first expense</p>
            </div>
          )}
        </section>

        {/* Balances */}
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">Balances</h2>
          <div className="space-y-3">
            {group.members.map((member) => {
              const balance = balances[member.id] || 0;
              const isPositive = balance >= 0;
              
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
                      {balance === 0 
                        ? 'settled up' 
                        : isPositive 
                          ? 'gets back' 
                          : 'owes'
                      }
                    </p>
                  </div>
                  <p 
                    className="font-semibold"
                    style={{
                      color: balance === 0 
                        ? undefined
                        : isPositive 
                          ? '#7b8763' 
                          : 'rgb(231, 110, 80)'
                    }}
                  >
                    {balance === 0 ? '-' : `${isPositive ? '+' : ''}${formatCurrency(balance, group.currency)}`}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* Add Expense Dialog */}
      <AddExpenseDialog
        open={showAddExpense}
        onOpenChange={setShowAddExpense}
        group={group}
      />

      {/* Add Member Dialog */}
      <AddMemberDialog
        open={showAddMember}
        onOpenChange={setShowAddMember}
        group={group}
      />
    </div>
  );
}
