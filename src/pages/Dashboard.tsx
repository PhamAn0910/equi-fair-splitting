import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ScanLine, BarChart3, Filter, Plus, X } from 'lucide-react';
import { useUser } from '@clerk/clerk-react';
import { useGroupStore } from '@/stores/groupStore';
import { useExpenseStore } from '@/stores/expenseStore';
import { BalanceCard } from '@/components/BalanceCard';
import { QuickActionButton } from '@/components/QuickActionButton';
import { ActivityItem } from '@/components/ActivityItem';
import { FloatingAddButton } from '@/components/FloatingAddButton';
import { MemberAvatar } from '@/components/MemberAvatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { CreateGroupDialog } from '@/components/CreateGroupDialog';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useUser();

  const { groups, createGroup, addMember, removeMember, getActiveGroup, setActiveGroup } = useGroupStore();
  const { expenses, getGroupBalances, getGroupTotalSpend } = useExpenseStore();

  const [showCreateGroup, setShowCreateGroup] = useState(false);

  const activeGroup = getActiveGroup();
  const hasGroups = groups.length > 0;

  // Get real recent activity from all groups
  const recentActivity = expenses
    .slice(0, 5)
    .map(expense => {
      const group = groups.find(g => g.id === expense.groupId);
      const payer = group?.members.find(m => m.id === expense.payerId);
      const diffDays = Math.floor((Date.now() - new Date(expense.date).getTime()) / (1000 * 60 * 60 * 24));

      return {
        description: expense.description,
        paidBy: payer?.name || 'Unknown',
        date: diffDays === 0 ? 'Today' : diffDays === 1 ? 'Yesterday' : `${diffDays} days ago`,
        amount: expense.totalAmount,
        category: expense.category,
      };
    });

  // Calculate active group stats
  const activeGroupStats = activeGroup ? {
    totalSpend: getGroupTotalSpend(activeGroup.id),
    balances: getGroupBalances(activeGroup.id),
  } : null;

  const yourBalance = activeGroup && activeGroupStats
    ? activeGroupStats.balances[activeGroup.members.find(m => m.isAdmin)?.id || ''] || 0
    : 0;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="px-4 pt-4 pb-4 safe-top">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground text-sm">Welcome back,</p>
            <h1 className="text-2xl font-bold text-foreground">
              {user?.firstName || user?.username || 'there'}!
            </h1>
          </div>
          {user?.imageUrl ? (
            <img
              src={user.imageUrl}
              alt={user.firstName || 'User'}
              className="w-12 h-12 rounded-full object-cover cursor-pointer"
              onClick={() => navigate('/account')}
            />
          ) : (
            <MemberAvatar
              name={user?.firstName || 'You'}
              colorHex="#6B7B5F"
              size="lg"
            />
          )}
        </div>
      </header>

      <main className="px-4 space-y-6">
        {/* Active Trip Card */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-foreground">Active Trip</h2>
            {hasGroups && (
              <button
                onClick={() => navigate('/groups')}
                className="text-sm text-accent font-medium hover:underline"
              >
                View All
              </button>
            )}
          </div>

          {hasGroups && activeGroup ? (
            <BalanceCard
              groupName={activeGroup.name}
              currency={activeGroup.currency}
              yourBalance={yourBalance}
              totalSpend={activeGroupStats?.totalSpend || 0}
              members={activeGroup.members}
              onClick={() => navigate(`/group/${activeGroup.id}`)}
            />
          ) : (
            <div
              onClick={() => setShowCreateGroup(true)}
              className="border-2 border-dashed border-border rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
            >
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <Plus className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="font-medium text-foreground">{hasGroups ? 'Create new trip' : 'Create your first trip'}</p>
              <p className="text-sm text-muted-foreground">{hasGroups ? 'Start a fresh group' : 'Add members and start splitting'}</p>
            </div>
          )}
        </section>

        {/* Quick Actions */}
        <section className="grid grid-cols-2 gap-3">
          <QuickActionButton
            icon={ScanLine}
            label="Scan & Paint"
            sublabel="Split bill instantly"
            onClick={() => activeGroup ? navigate('/scan') : setShowCreateGroup(true)}
          />
          <QuickActionButton
            icon={BarChart3}
            label="Analytics"
            sublabel="Check spending"
            onClick={() => navigate('/analytics')}
          />
        </section>

        {/* Recent Activity */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-foreground">Recent Activity</h2>
            <button
              onClick={() => navigate('/bills')}
              className="text-sm text-accent font-medium hover:underline"
            >
              View All
            </button>
          </div>

          {recentActivity.length > 0 ? (
            <div className="space-y-2">
              {recentActivity.map((activity, index) => (
                <ActivityItem
                  key={index}
                  {...activity}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No recent activity</p>
              <p className="text-sm text-muted-foreground">Create a group and add expenses to see activity here</p>
            </div>
          )}
        </section>
      </main>

      {/* Floating Add Button */}
      <FloatingAddButton onClick={() => setShowCreateGroup(true)} />

      {/* Create Group Dialog */}
      {/* Create Group Dialog */}
      <CreateGroupDialog
        open={showCreateGroup}
        onOpenChange={setShowCreateGroup}
      />
    </div>
  );
}
