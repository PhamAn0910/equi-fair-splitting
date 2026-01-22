import { useState } from 'react';
import { BottomNav } from '@/components/BottomNav';
import { useGroupStore } from '@/stores/groupStore';
import { useExpenseStore } from '@/stores/expenseStore';
import { formatCurrency, getGroupColor } from '@/lib/constants';
import { Receipt, Plus, Utensils, Car, Wine, ShoppingBag, Film, Building2, Package, ScanLine, PenLine, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AddExpenseDialog } from '@/components/AddExpenseDialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';

// Category icons mapping
const categoryIcons: Record<string, React.ReactNode> = {
  food: <Utensils className="w-5 h-5 text-foreground" />,
  drinks: <Wine className="w-5 h-5 text-foreground" />,
  transport: <Car className="w-5 h-5 text-foreground" />,
  shopping: <ShoppingBag className="w-5 h-5 text-foreground" />,
  entertainment: <Film className="w-5 h-5 text-foreground" />,
  accommodation: <Building2 className="w-5 h-5 text-foreground" />,
  other: <Package className="w-5 h-5 text-foreground" />,
};

export default function Bills() {
  const { groups, getActiveGroup } = useGroupStore();
  const { expenses } = useExpenseStore();
  const navigate = useNavigate();

  const activeGroup = getActiveGroup();
  const [selectedGroupId, setSelectedGroupId] = useState<string>('all');
  const [showAddOptions, setShowAddOptions] = useState(false);
  const [showAddExpenseDialog, setShowAddExpenseDialog] = useState(false);
  const [addExpenseGroupId, setAddExpenseGroupId] = useState<string | null>(null);

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

  // Get payer name for an expense
  const getPayerName = (expense: typeof expenses[0]) => {
    const group = groups.find(g => g.id === expense.groupId);
    const payer = group?.members.find(m => m.id === expense.payerId);
    const isYou = payer?.isAdmin;
    return isYou ? 'You' : payer?.name || 'Unknown';
  };

  // Get group info for an expense
  const getGroupInfo = (expense: typeof expenses[0]) => {
    const group = groups.find(g => g.id === expense.groupId);
    if (!group) return { name: 'Unknown', bgHex: 'transparent' };
    const color = getGroupColor(group.colorIndex ?? 0);
    return { name: group.name, bgHex: color.bgHex, hex: color.hex };
  };

  // Filter and sort expenses
  const filteredExpenses = selectedGroupId === 'all'
    ? expenses
    : expenses.filter(e => e.groupId === selectedGroupId);

  const sortedExpenses = [...filteredExpenses].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const handleAddOptionSelect = (option: 'scan' | 'manual') => {
    setShowAddOptions(false);
    if (option === 'scan') {
      navigate('/scan');
    } else {
      // Use selected filter group, active group, or first available group
      const targetGroup = selectedGroupId !== 'all'
        ? groups.find(g => g.id === selectedGroupId)
        : activeGroup || groups[0];

      if (targetGroup) {
        setAddExpenseGroupId(targetGroup.id);
        setShowAddExpenseDialog(true);
      }
    }
  };

  const selectedGroup = addExpenseGroupId ? groups.find(g => g.id === addExpenseGroupId) : null;

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="px-4 pt-6 pb-4 safe-top">
        <h1 className="text-2xl font-bold text-foreground">Bills ({filteredExpenses.length})</h1>
        <p className="text-muted-foreground">All your shared bills</p>
      </header>

      {/* Group Filter */}
      <div className="px-4 pb-4">
        <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
          <SelectTrigger className="w-full bg-card">
            <SelectValue placeholder="Filter by group" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Groups</SelectItem>
            {groups.map((group) => (
              <SelectItem key={group.id} value={group.id}>
                {group.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <main className="px-4 space-y-2">
        {sortedExpenses.map((expense) => {
          const groupInfo = getGroupInfo(expense);

          return (
            <div
              key={expense.id}
              onClick={() => navigate(`/bill/${expense.id}?from=bills`, { state: { from: 'bills' } })}
              className="relative flex items-center gap-3 p-4 bg-card rounded-xl cursor-pointer hover:opacity-90 transition-all border border-border/50 overflow-hidden"
            >
              {/* Left color bar */}
              <div
                className="absolute left-0 top-0 bottom-0 w-[2px]"
                style={{ backgroundColor: groupInfo.hex }}
              />

              {/* Icon with colored background */}
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${groupInfo.hex}1A` }}
              >
                <div style={{ color: `${groupInfo.hex}CC` }}>
                  {categoryIcons[expense.category] || <Receipt className="w-5 h-5" />}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">
                  {expense.description}
                </p>
                <p className="text-sm text-muted-foreground">
                  Paid by {getPayerName(expense)} • {formatExpenseDate(expense.date)}
                </p>
              </div>

              {/* Amount */}
              <p className="font-semibold text-foreground">
                {formatCurrency(expense.totalAmount)}
              </p>
            </div>
          );
        })}

        {sortedExpenses.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Receipt className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="font-medium text-foreground mb-2">No bills yet</p>
            <p className="text-sm text-muted-foreground">Start by scanning a receipt or adding manually</p>
          </div>
        )}
      </main>

      {/* Floating Add Button */}
      <button
        onClick={() => setShowAddOptions(true)}
        className="fixed bottom-24 right-4 w-14 h-14 rounded-full bg-accent text-accent-foreground flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-transform"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Add Options Dialog */}
      <Dialog open={showAddOptions} onOpenChange={setShowAddOptions}>
        <DialogContent className="sm:max-w-xs p-0 overflow-hidden">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Add Bill</h3>
              <button
                onClick={() => setShowAddOptions(false)}
                className="p-1 rounded-full hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => handleAddOptionSelect('scan')}
                className="w-full flex items-center gap-4 p-4 rounded-xl bg-muted hover:bg-muted/80 transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                  <ScanLine className="w-6 h-6 text-accent" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-foreground">Scan Receipt</p>
                  <p className="text-sm text-muted-foreground">Capture and split instantly</p>
                </div>
              </button>

              <button
                onClick={() => handleAddOptionSelect('manual')}
                className="w-full flex items-center gap-4 p-4 rounded-xl bg-muted hover:bg-muted/80 transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <PenLine className="w-6 h-6 text-primary" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-foreground">Add Manually</p>
                  <p className="text-sm text-muted-foreground">Enter bill details by hand</p>
                </div>
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Expense Dialog */}
      {selectedGroup && (
        <AddExpenseDialog
          open={showAddExpenseDialog}
          onOpenChange={(open) => {
            setShowAddExpenseDialog(open);
            if (!open) setAddExpenseGroupId(null);
          }}
          group={selectedGroup}
        />
      )}

      <BottomNav />
    </div>
  );
}