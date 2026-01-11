import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MoreVertical, ChevronDown, ChevronRight } from 'lucide-react';
import { useGroupStore } from '@/stores/groupStore';
import { useExpenseStore } from '@/stores/expenseStore';
import { SettlementGraph } from '@/components/SettlementGraph';
import { SettlementCard, type Settlement as SettlementType } from '@/components/SettlementCard';
import { BottomNav } from '@/components/BottomNav';
import { formatCurrency } from '@/lib/constants';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

/**
 * Optimizes debt settlements using the "greedy" algorithm.
 * Minimizes the number of transactions needed to settle all debts.
 */
function calculateOptimizedSettlements(
  balances: Record<string, number>,
  members: { id: string; name: string; colorHex: string; isAdmin: boolean }[]
): { from: string; to: string; amount: number }[] {
  const settlements: { from: string; to: string; amount: number }[] = [];
  
  // Create arrays of creditors and debtors
  const creditors: { id: string; amount: number }[] = [];
  const debtors: { id: string; amount: number }[] = [];
  
  Object.entries(balances).forEach(([id, balance]) => {
    if (balance > 0.01) {
      creditors.push({ id, amount: balance });
    } else if (balance < -0.01) {
      debtors.push({ id, amount: -balance }); // Convert to positive
    }
  });
  
  // Sort by amount (descending) for optimal matching
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);
  
  // Greedy matching
  let i = 0, j = 0;
  while (i < creditors.length && j < debtors.length) {
    const creditor = creditors[i];
    const debtor = debtors[j];
    
    const amount = Math.min(creditor.amount, debtor.amount);
    
    if (amount > 0.01) {
      settlements.push({
        from: debtor.id,
        to: creditor.id,
        amount: Math.round(amount * 100) / 100,
      });
    }
    
    creditor.amount -= amount;
    debtor.amount -= amount;
    
    if (creditor.amount < 0.01) i++;
    if (debtor.amount < 0.01) j++;
  }
  
  return settlements;
}

export default function Settlement() {
  const navigate = useNavigate();
  const { groups, activeGroupId, setActiveGroup } = useGroupStore();
  const { getGroupBalances, getGroupTotalSpend, getExpensesByGroup } = useExpenseStore();
  
  // Use active group or first group
  const currentGroup = groups.find(g => g.id === activeGroupId) || groups[0];
  const [settledIds, setSettledIds] = useState<Set<string>>(new Set());
  
  if (!currentGroup) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 pb-24">
        <p className="text-muted-foreground mb-4">No groups found</p>
        <button 
          onClick={() => navigate('/')}
          className="text-primary font-medium"
        >
          Create a group first
        </button>
        <BottomNav />
      </div>
    );
  }
  
  const balances = getGroupBalances(currentGroup.id);
  const totalSpend = getGroupTotalSpend(currentGroup.id);
  const expenses = getExpensesByGroup(currentGroup.id);
  
  // Find admin (You)
  const admin = currentGroup.members.find(m => m.isAdmin);
  
  // Calculate optimized settlements
  const optimizedSettlements = calculateOptimizedSettlements(balances, currentGroup.members);
  
  // Build graph nodes
  const graphNodes = currentGroup.members.map(m => ({
    id: m.id,
    name: m.name,
    colorHex: m.colorHex,
    balance: balances[m.id] || 0,
    isAdmin: m.isAdmin,
  }));
  
  // Build graph edges from optimized settlements
  const graphEdges = optimizedSettlements.map(s => ({
    from: s.from,
    to: s.to,
    amount: s.amount,
  }));
  
  // Build settlement cards from optimized settlements + recent expenses
  const buildSettlementCards = (): SettlementType[] => {
    const cards: SettlementType[] = [];
    
    // Add optimized settlements
    optimizedSettlements.forEach((s, index) => {
      const fromMember = currentGroup.members.find(m => m.id === s.from);
      const toMember = currentGroup.members.find(m => m.id === s.to);
      
      if (!fromMember || !toMember) return;
      
      // Find a relevant expense for description
      const relevantExpense = expenses.find(e => 
        e.payerId === s.to && e.splits.some(split => split.memberId === s.from)
      );
      
      const settlementId = `settlement-${index}`;
      const isSettled = settledIds.has(settlementId);
      
      cards.push({
        id: settlementId,
        fromMemberId: s.from,
        fromMemberName: fromMember.name,
        fromMemberColor: fromMember.colorHex,
        toMemberId: s.to,
        toMemberName: toMember.name,
        toMemberColor: toMember.colorHex,
        amount: s.amount,
        description: relevantExpense?.description || 'Group expenses',
        status: isSettled ? 'settled' : 'pending',
        isYouOwing: admin ? s.from === admin.id : false,
        isOwedToYou: admin ? s.to === admin.id : false,
      });
    });
    
    return cards;
  };
  
  const settlementCards = buildSettlementCards();
  const pendingCards = settlementCards.filter(c => c.status === 'pending');
  const settledCards = settlementCards.filter(c => c.status === 'settled');
  
  const handleMarkAsPaid = (settlementId: string) => {
    setSettledIds(prev => new Set(prev).add(settlementId));
  };
  
  const currencySymbol = currentGroup.currency === 'EUR' ? '€' : 
                         currentGroup.currency === 'USD' ? '$' : 
                         currentGroup.currency;

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
          <h1 className="text-lg font-semibold text-foreground">Settlement Flow</h1>
          <button className="p-2 -mr-2 rounded-lg hover:bg-muted transition-colors">
            <MoreVertical className="w-5 h-5 text-foreground" />
          </button>
        </div>
      </header>
      
      <main className="p-4 space-y-6">
        {/* Group Selector */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Current Cycle</p>
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1 text-xl font-bold text-foreground hover:text-primary transition-colors">
                {currentGroup.name}
                <ChevronDown className="w-5 h-5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="bg-popover">
                {groups.map(group => (
                  <DropdownMenuItem
                    key={group.id}
                    onClick={() => setActiveGroup(group.id)}
                    className={group.id === currentGroup.id ? 'bg-muted' : ''}
                  >
                    {group.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          <div className="px-3 py-1.5 bg-primary/10 rounded-lg">
            <span className="text-sm font-semibold text-primary">
              {formatCurrency(totalSpend, currentGroup.currency)} Total
            </span>
          </div>
        </div>
        
        {/* Visual Graph */}
        {currentGroup.members.length > 1 && (
          <SettlementGraph
            nodes={graphNodes}
            edges={graphEdges}
            currency={currencySymbol}
          />
        )}
        
        {/* Pending Settlements */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-foreground">
              Pending Settlements
            </h2>
            {pendingCards.length > 3 && (
              <button className="flex items-center gap-1 text-sm text-primary font-medium hover:underline">
                View All
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
          
          {pendingCards.length > 0 ? (
            <div className="space-y-3">
              {pendingCards.slice(0, 5).map((settlement) => (
                <SettlementCard
                  key={settlement.id}
                  settlement={settlement}
                  currency={currencySymbol}
                  onMarkAsPaid={handleMarkAsPaid}
                />
              ))}
            </div>
          ) : (
            <div className="bg-card rounded-xl p-6 text-center">
              <p className="text-muted-foreground">
                {totalSpend > 0 
                  ? '🎉 Everyone is settled up!' 
                  : 'No expenses to settle yet'}
              </p>
            </div>
          )}
        </section>
        
        {/* Settled Settlements */}
        {settledCards.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              Recently Settled
            </h2>
            <div className="space-y-3">
              {settledCards.map((settlement) => (
                <SettlementCard
                  key={settlement.id}
                  settlement={settlement}
                  currency={currencySymbol}
                />
              ))}
            </div>
          </section>
        )}
      </main>
      
      <BottomNav />
    </div>
  );
}
