import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MoreVertical, ScanLine, Plus, Users, Receipt, UserPlus, Pencil, Trash2 } from 'lucide-react';
import { useGroupStore } from '@/stores/groupStore';
import { useExpenseStore } from '@/stores/expenseStore';
import { MemberAvatar } from '@/components/MemberAvatar';
import { ActivityItem } from '@/components/ActivityItem';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AddExpenseDialog } from '@/components/AddExpenseDialog';
import { AddMemberDialog } from '@/components/AddMemberDialog';
import { formatCurrency } from '@/lib/constants';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
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

export default function GroupDetail() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { groups, setActiveGroup, updateGroup, deleteGroup } = useGroupStore();
  const { getExpensesByGroup, getGroupBalances, getGroupTotalSpend, deleteExpensesByGroup } = useExpenseStore();

  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editGroupName, setEditGroupName] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

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

  const handleStartEdit = () => {
    setEditGroupName(group.name);
    setShowEditDialog(true);
  };

  const handleSaveEdit = () => {
    if (!editGroupName.trim()) return;
    updateGroup(group.id, { name: editGroupName.trim() });
    setShowEditDialog(false);
    setEditGroupName('');
  };

  const handleConfirmDelete = () => {
    // Delete all expenses associated with this group first
    deleteExpensesByGroup(group.id);
    // Then delete the group
    deleteGroup(group.id);
    setShowDeleteDialog(false);
    navigate('/groups');
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
            onClick={() => navigate('/groups')}
            className="p-2 -ml-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-2 -mr-2 rounded-lg hover:bg-white/10 transition-colors">
                <MoreVertical className="w-5 h-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-popover">
              <DropdownMenuItem onClick={handleStartEdit}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit Group
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setShowDeleteDialog(true)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Group
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <h1 className="text-2xl font-bold mb-1">{group.name}</h1>
        <p className="text-primary-foreground/70 mb-6">
          {group.members.length} members
        </p>

        {/* Member Row */}
        <div className="flex items-center gap-3 overflow-x-auto pb-2">
          {group.members.map((member) => (
            <div key={member.id} className="flex flex-col items-center gap-1 flex-shrink-0">
              <div className="p-1">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-base font-semibold text-white"
                  style={{ backgroundColor: member.colorHex }}
                >
                  {member.name.slice(0, 2).toUpperCase()}
                </div>
              </div>
              <span className="text-xs font-medium text-primary-foreground truncate max-w-[60px]">
                {member.name}
              </span>
            </div>
          ))}
          <div className="flex flex-col items-center gap-1 flex-shrink-0">
            <button
              onClick={() => setShowAddMember(true)}
              className="w-12 h-12 rounded-full border-2 border-dashed border-primary-foreground/30 flex items-center justify-center text-primary-foreground/50 hover:border-primary-foreground hover:text-primary-foreground transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
            <span className="text-xs text-primary-foreground/70">&nbsp;</span>
          </div>
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
              style={{ color: yourBalance >= 0 ? '#3b761f' : 'rgb(231, 110, 80)' }}
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
                          ? '#3b761f'
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

      {/* Edit Group Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
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
                onClick={() => setShowEditDialog(false)}
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
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Group</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{group.name}"? This will also delete all expenses and bills associated with this group. This action cannot be undone.
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
