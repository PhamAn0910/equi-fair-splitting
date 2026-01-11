import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, Edit } from 'lucide-react';
import { useExpenseStore } from '@/stores/expenseStore';
import { useGroupStore } from '@/stores/groupStore';
import { MemberAvatar } from '@/components/MemberAvatar';
import { formatCurrency } from '@/lib/constants';
import { BottomNav } from '@/components/BottomNav';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// Category icons mapping
const categoryIcons: Record<string, string> = {
  food: '🍽️',
  drinks: '🥂',
  transport: '🚗',
  shopping: '🛍️',
  entertainment: '🎬',
  accommodation: '🏨',
  other: '📦',
};

export default function BillDetail() {
  const { billId } = useParams();
  const navigate = useNavigate();
  const { expenses, getExpensesByGroup } = useExpenseStore();
  const { groups } = useGroupStore();

  const expense = expenses.find(e => e.id === billId);

  if (!expense) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 pb-24">
        <p className="text-muted-foreground mb-4">Bill not found</p>
        <Button onClick={() => navigate(-1)}>Go Back</Button>
        <BottomNav />
      </div>
    );
  }

  const group = groups.find(g => g.id === expense.groupId);
  const groupExpenses = group ? getExpensesByGroup(group.id) : [];
  const currentIndex = groupExpenses.findIndex(e => e.id === billId);
  const prevExpense = currentIndex > 0 ? groupExpenses[currentIndex - 1] : null;
  const nextExpense = currentIndex < groupExpenses.length - 1 ? groupExpenses[currentIndex + 1] : null;

  const payer = group?.members.find(m => m.id === expense.payerId);

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const categoryIcon = categoryIcons[expense.category] || '📦';

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border safe-top">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-lg hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>

          {/* Navigation between bills */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => prevExpense && navigate(`/bill/${prevExpense.id}`)}
              disabled={!prevExpense}
              className="p-1 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4 text-muted-foreground" />
            </button>
            <span className="text-sm font-medium text-foreground max-w-[150px] truncate">
              {expense.description}
            </span>
            <button
              onClick={() => nextExpense && navigate(`/bill/${nextExpense.id}`)}
              disabled={!nextExpense}
              className="p-1 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          <button className="text-sm font-medium text-primary hover:underline">
            Edit
          </button>
        </div>
      </header>

      <main className="p-4 space-y-6">
        {/* Bill Summary Card */}
        <div className="bg-card rounded-2xl p-6 text-center shadow-card">
          <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center text-3xl">
            {categoryIcon}
          </div>
          <p className="text-3xl font-bold text-foreground mb-2">
            {formatCurrency(expense.totalAmount)}
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            {payer && (
              <MemberAvatar name={payer.name} colorHex={payer.colorHex} size="sm" />
            )}
            <span>Paid by {payer?.name || 'Unknown'} • {formatDate(expense.date)}</span>
          </div>
        </div>

        {/* Members Split Section */}
        <section>
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">
            {expense.splits.length} People Shared
          </p>

          <div className="space-y-2">
            {expense.splits.map((split) => {
              const member = group?.members.find(m => m.id === split.memberId);
              if (!member) return null;

              const isPayer = member.id === expense.payerId;

              return (
                <div
                  key={split.memberId}
                  className="flex items-center gap-3 p-3 bg-card rounded-xl"
                >
                  <div className="relative">
                    <MemberAvatar
                      name={member.name}
                      colorHex={member.colorHex}
                      size="md"
                    />
                    {isPayer && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                        <span className="text-[8px] text-primary-foreground">💵</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground">{member.name}</p>
                      {isPayer && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-primary/10 text-primary">
                          PAYER
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {isPayer ? 'Covered full amount' : 'Owes'}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="font-semibold text-foreground">
                      {formatCurrency(split.calculatedAmount)}
                    </p>
                    {!isPayer && (
                      <p className="text-xs text-destructive">Owes</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Item breakdown if available */}
        {expense.items && expense.items.length > 0 && (
          <section>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">
              Item Breakdown
            </p>

            <div className="bg-card rounded-xl overflow-hidden">
              {expense.items.map((item, index) => (
                <div
                  key={item.id}
                  className={`flex items-center justify-between p-3 ${
                    index !== expense.items!.length - 1 ? 'border-b border-border' : ''
                  }`}
                >
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{item.name}</p>
                    {item.quantity > 1 && (
                      <p className="text-sm text-muted-foreground">
                        Qty: {item.quantity}
                      </p>
                    )}
                  </div>
                  <p className="font-medium text-foreground">
                    {formatCurrency(item.price * item.quantity)}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Settle Up Button */}
        <Button
          onClick={() => navigate('/settle')}
          className="w-full h-12 rounded-xl"
        >
          <span className="mr-2">✓</span>
          Settle Up
        </Button>
      </main>

      <BottomNav />
    </div>
  );
}
