import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ScanLine, BarChart3, Filter, Plus, X } from 'lucide-react';
import { useGroupStore } from '@/stores/groupStore';
import { useExpenseStore } from '@/stores/expenseStore';
import { BalanceCard } from '@/components/BalanceCard';
import { QuickActionButton } from '@/components/QuickActionButton';
import { ActivityItem } from '@/components/ActivityItem';
import { BottomNav } from '@/components/BottomNav';
import { FloatingAddButton } from '@/components/FloatingAddButton';
import { MemberAvatar } from '@/components/MemberAvatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function Dashboard() {
  const navigate = useNavigate();
  const { groups, createGroup, addMember, removeMember, getActiveGroup, setActiveGroup } = useGroupStore();
  const { expenses, getGroupBalances, getGroupTotalSpend } = useExpenseStore();
  
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newMemberName, setNewMemberName] = useState('');
  const [createdGroup, setCreatedGroup] = useState<string | null>(null);

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

  const handleCreateGroup = () => {
    if (!newGroupName.trim()) return;
    const group = createGroup(newGroupName.trim());
    setCreatedGroup(group.id);
    setNewGroupName('');
  };

  const handleAddMember = () => {
    if (!newMemberName.trim() || !createdGroup) return;
    addMember(createdGroup, newMemberName.trim());
    setNewMemberName('');
  };

  const handleRemoveMember = (memberId: string) => {
    if (!createdGroup) return;
    removeMember(createdGroup, memberId);
  };

  const handleFinishSetup = () => {
    setShowCreateGroup(false);
    if (createdGroup) {
      setActiveGroup(createdGroup);
      navigate(`/group/${createdGroup}`);
    }
    setCreatedGroup(null);
  };

  const currentCreatingGroup = groups.find(g => g.id === createdGroup);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="px-4 pt-4 pb-2 safe-top">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-muted-foreground text-sm">Welcome back,</p>
            <h1 className="text-2xl font-bold text-foreground">Shinomiya!</h1>
          </div>
          <MemberAvatar
            name="You"
            colorHex="#6B7B5F"
            size="lg"
          />
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search groups or friends..."
            className="pl-10 bg-card border-border"
          />
        </div>
      </header>

      <main className="px-4 space-y-6">
        {/* Active Trip Card */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-foreground">Active Trip</h2>
            {hasGroups && (
              <button 
                onClick={() => navigate('/expenses')}
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
              <p className="font-medium text-foreground">Create your first trip</p>
              <p className="text-sm text-muted-foreground">Add members and start splitting</p>
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
            <button className="p-2 rounded-lg hover:bg-muted transition-colors">
              <Filter className="w-4 h-4 text-muted-foreground" />
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

      {/* Bottom Navigation */}
      <BottomNav />

      {/* Create Group Dialog */}
      <Dialog open={showCreateGroup} onOpenChange={setShowCreateGroup}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {createdGroup ? 'Add Members' : 'Create New Group'}
            </DialogTitle>
          </DialogHeader>

          {!createdGroup ? (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Group Name
                </label>
                <Input
                  placeholder="e.g., Vietnam Trip, Dinner Club"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateGroup()}
                />
              </div>
              <Button 
                onClick={handleCreateGroup} 
                className="w-full"
                disabled={!newGroupName.trim()}
              >
                Create Group
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Current members */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Members ({currentCreatingGroup?.members.length || 0})
                </label>
                <div className="space-y-2">
                  {currentCreatingGroup?.members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-3 bg-muted/50 px-3 py-2 rounded-xl"
                    >
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium text-white"
                        style={{ backgroundColor: member.colorHex }}
                      >
                        {member.name.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="flex-1 font-medium">{member.name}</span>
                      {member.isAdmin ? (
                        <span className="text-xs text-muted-foreground">Organizer</span>
                      ) : (
                        <button 
                          onClick={() => handleRemoveMember(member.id)}
                          className="text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Add member input */}
              <div className="flex gap-2">
                <Input
                  placeholder="Add member name..."
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddMember()}
                />
                <Button 
                  onClick={handleAddMember}
                  variant="secondary"
                  disabled={!newMemberName.trim()}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              <Button 
                onClick={handleFinishSetup} 
                className="w-full"
              >
                Start Splitting
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
