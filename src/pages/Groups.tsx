import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, X } from 'lucide-react';
import { useGroupStore } from '@/stores/groupStore';
import { useExpenseStore } from '@/stores/expenseStore';
import { MemberAvatar } from '@/components/MemberAvatar';
import { formatCurrency, getGroupColor } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';


export default function Groups() {
  const navigate = useNavigate();
  const { groups, createGroup, updateGroup, deleteGroup, addMember, removeMember, setActiveGroup } = useGroupStore();
  const { getGroupTotalSpend, getGroupBalances, deleteExpensesByGroup } = useExpenseStore();

  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newMemberName, setNewMemberName] = useState('');
  const [tempMembers, setTempMembers] = useState<string[]>([]);
  const [showMemberStep, setShowMemberStep] = useState(false);

  const handleCreateGroup = () => {
    if (!newGroupName.trim()) return;
    // Don't create the group yet, just move to member step
    setShowMemberStep(true);
  };

  const handleAddMember = () => {
    if (!newMemberName.trim()) return;
    setTempMembers([...tempMembers, newMemberName.trim()]);
    setNewMemberName('');
  };

  const handleRemoveMember = (index: number) => {
    setTempMembers(tempMembers.filter((_, i) => i !== index));
  };

  const handleFinishSetup = async () => {
    // Only create the group when user clicks "Start Splitting"
    if (!newGroupName.trim()) return;
    const group = await createGroup(newGroupName.trim());
    if (!group) return;
    // Add all temporary members
    for (const memberName of tempMembers) {
      await addMember(group.id, { name: memberName });
    }
    // Navigate to the group
    setActiveGroup(group.id);
    navigate(`/group/${group.id}`);
    // Clean up state
    handleCloseDialog();
  };

  const handleCloseDialog = () => {
    setShowCreateGroup(false);
    setShowMemberStep(false);
    setNewGroupName('');
    setNewMemberName('');
    setTempMembers([]);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="px-4 pt-6 pb-4 safe-top">
        <h1 className="text-2xl font-bold text-foreground">Groups</h1>
        <p className="text-muted-foreground">Your trips and expense groups</p>
      </header>

      <main className="px-4 space-y-2">
        {groups.map((group) => {
          const totalSpend = getGroupTotalSpend(group.id);
          const balances = getGroupBalances(group.id);
          const admin = group.members.find(m => m.isAdmin);
          const yourBalance = admin ? balances[admin.id] || 0 : 0;
          const groupColor = getGroupColor(group.colorIndex ?? 0);

          return (
            <div
              key={group.id}
              onClick={() => {
                setActiveGroup(group.id);
                navigate(`/group/${group.id}`);
              }}
              className="relative flex flex-col gap-3 p-4 bg-card rounded-xl cursor-pointer hover:opacity-90 transition-all border border-border/50 overflow-hidden"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-foreground">{group.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {group.members.length} members
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Total spend</p>
                  <p className="font-semibold text-foreground">
                    {formatCurrency(totalSpend, group.currency)}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex -space-x-2">
                  {group.members.slice(0, 4).map((member) => (
                    <MemberAvatar
                      key={member.id}
                      name={member.name}
                      colorHex={member.colorHex}
                      size="sm"
                    />
                  ))}
                  {group.members.length > 4 && (
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground border-2 border-background">
                      +{group.members.length - 4}
                    </div>
                  )}
                </div>
                <p
                  className="text-sm font-medium"
                  style={{ color: yourBalance === 0 ? undefined : yourBalance >= 0 ? '#3b761f' : 'rgb(231, 110, 80)' }}
                >
                  {yourBalance === 0 ? 'Settled' : `${yourBalance >= 0 ? '+' : ''}${formatCurrency(yourBalance, group.currency)}`}
                </p>
              </div>
            </div>
          );
        })}

        {groups.length === 0 && (
          <div
            onClick={() => setShowCreateGroup(true)}
            className="border-2 border-dashed border-border rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
          >
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="font-medium text-foreground mb-2">No groups yet</p>
            <p className="text-sm text-muted-foreground text-center">
              Create your first group to start splitting expenses
            </p>
          </div>
        )}
      </main>

      {/* Floating Add Button */}
      <button
        onClick={() => setShowCreateGroup(true)}
        className="fixed bottom-24 right-4 w-14 h-14 rounded-full bg-accent text-accent-foreground flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-transform"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Create Group Dialog */}
      <Dialog open={showCreateGroup} onOpenChange={(open) => !open && handleCloseDialog()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {showMemberStep ? 'Add Members' : 'Create New Group'}
            </DialogTitle>
          </DialogHeader>

          {!showMemberStep ? (
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
                Next
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Current members */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Members ({tempMembers.length + 1})
                </label>
                <div className="space-y-2">
                  {/* Show organizer (You) */}
                  <div className="flex items-center gap-3 bg-muted/50 px-3 py-2 rounded-xl">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium text-white bg-orange-500">
                      YO
                    </div>
                    <span className="flex-1 font-medium">You</span>
                    <span className="text-xs text-muted-foreground">Organizer</span>
                  </div>
                  {/* Show temporary members */}
                  {tempMembers.map((memberName, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 bg-muted/50 px-3 py-2 rounded-xl"
                    >
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium text-white bg-blue-500">
                        {memberName.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="flex-1 font-medium">{memberName}</span>
                      <button
                        onClick={() => handleRemoveMember(index)}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
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
