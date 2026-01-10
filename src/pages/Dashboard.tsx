import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ScanLine, BarChart3, Filter, Plus, X } from 'lucide-react';
import { useGroupStore } from '@/stores/groupStore';
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
  const { groups, createGroup, addMember, getActiveGroup, setActiveGroup } = useGroupStore();
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newMemberName, setNewMemberName] = useState('');
  const [createdGroup, setCreatedGroup] = useState<string | null>(null);

  const activeGroup = getActiveGroup();
  const hasGroups = groups.length > 0;

  // Mock recent activity
  const recentActivity = [
    { description: 'Pho 10 Ly Quoc Su', paidBy: 'Alex', date: 'Yesterday', amount: 15.50, isOwed: true, category: 'food' as const },
    { description: 'Grab to Hotel', paidBy: 'Sarah', date: '2 days ago', amount: 8.20, isOwed: false, category: 'transport' as const },
    { description: 'Rooftop Drinks', paidBy: 'You', date: '3 days ago', amount: 42.00, isOwed: false, category: 'drinks' as const },
  ];

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

  const handleFinishSetup = () => {
    setShowCreateGroup(false);
    setCreatedGroup(null);
    if (createdGroup) {
      setActiveGroup(createdGroup);
    }
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
            <button className="text-sm text-accent font-medium hover:underline">
              View All
            </button>
          </div>

          {hasGroups && activeGroup ? (
            <BalanceCard
              groupName={activeGroup.name}
              currency={activeGroup.currency}
              yourBalance={activeGroup.yourBalance || 120}
              totalSpend={activeGroup.totalSpend || 1450.50}
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
            onClick={() => navigate('/scan')}
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

          <div className="space-y-2">
            {recentActivity.map((activity, index) => (
              <ActivityItem
                key={index}
                {...activity}
              />
            ))}
          </div>
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
                  Members
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {currentCreatingGroup?.members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-full"
                    >
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: member.colorHex }}
                      />
                      <span className="text-sm font-medium">{member.name}</span>
                      {!member.isAdmin && (
                        <button className="text-muted-foreground hover:text-destructive">
                          <X className="w-3 h-3" />
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
                Done
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
