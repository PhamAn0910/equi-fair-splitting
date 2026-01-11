import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ScanLine, BarChart3, Filter, Plus, X } from 'lucide-react';
import { useGroups } from '@/hooks/useGroups';
import { useGroupMembers } from '@/hooks/useGroupMembers';
import { useExpenseStore } from '@/stores/expenseStore';
import { BalanceCard } from '@/components/BalanceCard';
import { QuickActionButton } from '@/components/QuickActionButton';
import { ActivityItem } from '@/components/ActivityItem';
import { BottomNav } from '@/components/BottomNav';
import { FloatingAddButton } from '@/components/FloatingAddButton';
import { MemberAvatar } from '@/components/MemberAvatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { getNextColor, MEMBER_COLORS } from '@/lib/constants';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { groups, isLoading, createGroup, isCreating } = useGroups();
  const { expenses, getGroupBalances, getGroupTotalSpend } = useExpenseStore();
  
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newMemberName, setNewMemberName] = useState('');
  const [createdGroupId, setCreatedGroupId] = useState<string | null>(null);
  const [pendingMembers, setPendingMembers] = useState<Array<{ id: string; name: string; colorHex: string }>>([]);
  
  // Use the members hook for the created group
  const { members: createdGroupMembers, addMember, isAdding } = useGroupMembers(createdGroupId || undefined);

  const activeGroup = groups[0]; // First group is the most recent
  const hasGroups = groups.length > 0;

  // Get display name from email
  const displayName = user?.email?.split('@')[0] || 'You';

  // Get real recent activity from all groups
  const recentActivity = expenses
    .slice(0, 5)
    .map(expense => {
      const diffDays = Math.floor((Date.now() - new Date(expense.date).getTime()) / (1000 * 60 * 60 * 24));
      
      return {
        description: expense.description,
        paidBy: 'Unknown',
        date: diffDays === 0 ? 'Today' : diffDays === 1 ? 'Yesterday' : `${diffDays} days ago`,
        amount: expense.totalAmount,
        category: expense.category,
      };
    });

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;
    
    createGroup(
      { name: newGroupName.trim(), currency: 'EUR' },
      {
        onSuccess: (data) => {
          setCreatedGroupId(data.id);
          setNewGroupName('');
          // Add the admin member automatically
          const adminColor = MEMBER_COLORS[0];
          addMember({ 
            name: displayName, 
            avatarColor: adminColor.hex, 
            isAdmin: true 
          });
        }
      }
    );
  };

  const handleAddMember = () => {
    if (!newMemberName.trim() || !createdGroupId) return;
    
    // Get next available color
    const usedColors = createdGroupMembers.map(m => m.avatar_color);
    const nextColor = getNextColor(usedColors.map(c => {
      const found = MEMBER_COLORS.find(mc => mc.hex === c);
      return found?.name || '';
    }));
    
    addMember({ 
      name: newMemberName.trim(), 
      avatarColor: nextColor.hex,
      isAdmin: false 
    });
    setNewMemberName('');
  };

  const handleFinishSetup = () => {
    setShowCreateGroup(false);
    if (createdGroupId) {
      navigate(`/group/${createdGroupId}`);
    }
    setCreatedGroupId(null);
    setPendingMembers([]);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <header className="px-4 pt-4 pb-2 safe-top">
          <div className="flex items-center justify-between mb-4">
            <div>
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-32" />
            </div>
            <Skeleton className="h-12 w-12 rounded-full" />
          </div>
          <Skeleton className="h-10 w-full" />
        </header>
        <main className="px-4 space-y-6 mt-4">
          <Skeleton className="h-40 w-full rounded-2xl" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="px-4 pt-4 pb-2 safe-top">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-muted-foreground text-sm">Welcome back,</p>
            <h1 className="text-2xl font-bold text-foreground">{displayName}!</h1>
          </div>
          <MemberAvatar
            name={displayName}
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
              currency={activeGroup.currency || 'EUR'}
              yourBalance={0}
              totalSpend={0}
              members={[]}
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
              {createdGroupId ? 'Add Members' : 'Create New Group'}
            </DialogTitle>
          </DialogHeader>

          {!createdGroupId ? (
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
                disabled={!newGroupName.trim() || isCreating}
              >
                {isCreating ? 'Creating...' : 'Create Group'}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Current members */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Members ({createdGroupMembers.length})
                </label>
                <div className="space-y-2">
                  {createdGroupMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-3 bg-muted/50 px-3 py-2 rounded-xl"
                    >
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium text-white"
                        style={{ backgroundColor: member.avatar_color }}
                      >
                        {member.name.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="flex-1 font-medium">{member.name}</span>
                      {member.is_admin && (
                        <span className="text-xs text-muted-foreground">Organizer</span>
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
                  disabled={!newMemberName.trim() || isAdding}
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
