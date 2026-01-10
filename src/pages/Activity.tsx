import { BottomNav } from '@/components/BottomNav';
import { ActivityItem } from '@/components/ActivityItem';

export default function Activity() {
  const activities = [
    { description: 'Pho 10 Ly Quoc Su', paidBy: 'Alex', date: 'Yesterday', amount: 15.50, isOwed: true, category: 'food' as const },
    { description: 'Grab to Hotel', paidBy: 'Sarah', date: '2 days ago', amount: 8.20, isOwed: false, category: 'transport' as const },
    { description: 'Rooftop Drinks', paidBy: 'You', date: '3 days ago', amount: 42.00, isOwed: false, category: 'drinks' as const },
    { description: 'Museum Tickets', paidBy: 'Mike', date: '4 days ago', amount: 28.00, isOwed: true, category: 'other' as const },
    { description: 'Coffee & Pastries', paidBy: 'You', date: '5 days ago', amount: 18.50, isOwed: false, category: 'drinks' as const },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="px-4 pt-6 pb-4 safe-top">
        <h1 className="text-2xl font-bold text-foreground">Activity</h1>
        <p className="text-muted-foreground">Your recent transactions</p>
      </header>

      <main className="px-4 space-y-2">
        {activities.map((activity, index) => (
          <ActivityItem key={index} {...activity} />
        ))}
      </main>

      <BottomNav />
    </div>
  );
}
