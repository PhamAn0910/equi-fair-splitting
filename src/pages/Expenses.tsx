import { BottomNav } from '@/components/BottomNav';
import { useGroupStore } from '@/stores/groupStore';
import { formatCurrency } from '@/lib/constants';
import { Receipt, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Expenses() {
  const { groups } = useGroupStore();
  const navigate = useNavigate();

  const allExpenses = [
    { id: '1', description: 'Sushi Zen Restaurant', group: 'Vietnam Trip', amount: 73.00, date: 'Today' },
    { id: '2', description: 'Uber to Temple', group: 'Vietnam Trip', amount: 12.50, date: 'Yesterday' },
    { id: '3', description: 'Street Food Tour', group: 'Vietnam Trip', amount: 35.00, date: '2 days ago' },
    { id: '4', description: 'Hotel Split', group: 'Weekend Getaway', amount: 240.00, date: '1 week ago' },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="px-4 pt-6 pb-4 safe-top">
        <h1 className="text-2xl font-bold text-foreground">Expenses</h1>
        <p className="text-muted-foreground">All your shared expenses</p>
      </header>

      <main className="px-4 space-y-3">
        {allExpenses.map((expense) => (
          <div key={expense.id} className="flex items-center gap-3 p-4 bg-card rounded-xl">
            <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
              <Receipt className="w-5 h-5 text-foreground" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground">{expense.description}</p>
              <p className="text-sm text-muted-foreground">{expense.group} • {expense.date}</p>
            </div>
            <p className="font-semibold text-foreground">{formatCurrency(expense.amount)}</p>
          </div>
        ))}

        {allExpenses.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Receipt className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="font-medium text-foreground mb-2">No expenses yet</p>
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
