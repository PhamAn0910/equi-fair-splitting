import { BottomNav } from '@/components/BottomNav';
import { useGroupStore } from '@/stores/groupStore';
import { useExpenseStore } from '@/stores/expenseStore';
import { formatCurrency } from '@/lib/constants';
import { Receipt, Plus, Utensils, Car, Wine, ShoppingBag, Film, Building2, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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

export default function Expenses() {
  const { groups } = useGroupStore();
  const { expenses } = useExpenseStore();
  const navigate = useNavigate();

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

  // Sort expenses by date (newest first)
  const sortedExpenses = [...expenses].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="px-4 pt-6 pb-4 safe-top">
        <h1 className="text-2xl font-bold text-foreground">Bills ({expenses.length})</h1>
        <p className="text-muted-foreground">All your shared bills</p>
      </header>

      <main className="px-4 space-y-3">
        {sortedExpenses.map((expense) => (
          <div
            key={expense.id}
            onClick={() => navigate(`/bill/${expense.id}`)}
            className="flex items-center gap-3 p-4 bg-card rounded-xl cursor-pointer hover:bg-muted/50 transition-colors"
          >
            <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
              {categoryIcons[expense.category] || <Receipt className="w-5 h-5 text-foreground" />}
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground">{expense.description}</p>
              <p className="text-sm text-muted-foreground">
                Paid by {getPayerName(expense)} • {formatExpenseDate(expense.date)}
              </p>
            </div>
            <p className="font-semibold text-foreground">{formatCurrency(expense.totalAmount)}</p>
          </div>
        ))}

        {expenses.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Receipt className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="font-medium text-foreground mb-2">No bills yet</p>
            <p className="text-sm text-muted-foreground">Start by scanning a receipt</p>
          </div>
        )}
      </main>

      <button
        onClick={() => navigate('/scan')}
        className="fixed bottom-24 right-4 w-14 h-14 rounded-full bg-accent text-accent-foreground flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-transform"
      >
        <Plus className="w-6 h-6" />
      </button>

      <BottomNav />
    </div>
  );
}
