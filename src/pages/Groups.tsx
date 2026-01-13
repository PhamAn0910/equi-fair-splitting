import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, X, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { useGroupStore } from '@/stores/groupStore';
import { useExpenseStore } from '@/stores/expenseStore';
import { BottomNav } from '@/components/BottomNav';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function Groups() {
  const navigate = useNavigate();
  const { groups, createGroup, updateGroup, deleteGroup, addMember, removeMember, setActiveGroup } = useGroupStore();
  const { getGroupTotalSpend, getGroupBalances, deleteExpensesByGroup } = useExpenseStore();

  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newMemberName, setNewMemberName] = useState('');
  const [tempMembers, setTempMembers] = useState<string[]>([]);
  const [showMemberStep, setShowMemberStep] = useState(false);

  // Edit/Delete state
  const [editingGroup, setEditingGroup] = useState<string | null>(null);
  const [editGroupName, setEditGroupName] = useState('');
  const [deletingGroup, setDeletingGroup] = useState<string | null>(null);

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

  const handleFinishSetup = () => {
    // Only create the group when user clicks "Start Splitting"
    if (!newGroupName.trim()) return;
    const group = createGroup(newGroupName.trim());
    // Add all temporary members
    tempMembers.forEach(memberName => {
      addMember(group.id, memberName);
    });
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

  const handleStartEdit = (group: typeof groups[0], e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingGroup(group.id);
    setEditGroupName(group.name);
  };

  const handleSaveEdit = () => {
    if (!editingGroup || !editGroupName.trim()) return;
    updateGroup(editingGroup, { name: editGroupName.trim() });
    setEditingGroup(null);
    setEditGroupName('');
  };

  const handleConfirmDelete = () => {
    if (!deletingGroup) return;
    // Delete all expenses associated with this group first
    deleteExpensesByGroup(deletingGroup);
    // Then delete the group
    deleteGroup(deletingGroup);
    setDeletingGroup(null);
  };

  const groupToDelete = groups.find(g => g.id === deletingGroup);

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
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Total spend</p>
                    <p className="font-semibold text-foreground">
                      {formatCurrency(totalSpend, group.currency)}
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-popover">
                      <DropdownMenuItem onClick={(e) => handleStartEdit(group, e)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingGroup(group.id);
                        }}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
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
                  style={{ color: yourBalance === 0 ? undefined : yourBalance >= 0 ? '#7b8763' : 'rgb(231, 110, 80)' }}
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

      <BottomNav />

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

      {/* Edit Group Dialog */}
      <Dialog open={!!editingGroup} onOpenChange={(open) => !open && setEditingGroup(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Group</DialogTitle>
            <DialogDescription>
              Change the group name
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Group Name
              </label>
              <Input
                placeholder="Group name"
                value={editGroupName}
                onChange={(e) => setEditGroupName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
              />
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setEditingGroup(null)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSaveEdit} 
                className="flex-1"
                disabled={!editGroupName.trim()}
              >
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingGroup} onOpenChange={(open) => !open && setDeletingGroup(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Group</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{groupToDelete?.name}"? This will also delete all expenses and bills associated with this group. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
