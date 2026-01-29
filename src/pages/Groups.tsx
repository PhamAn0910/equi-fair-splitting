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
} from '@/components/ui/dialog';
import { CreateGroupDialog } from '@/components/CreateGroupDialog';


export default function Groups() {
  const navigate = useNavigate();
  const { groups, createGroup, updateGroup, deleteGroup, addMember, removeMember, setActiveGroup } = useGroupStore();
  const { getGroupTotalSpend, getGroupBalances, deleteExpensesByGroup } = useExpenseStore();

  const [showCreateGroup, setShowCreateGroup] = useState(false);

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
      <CreateGroupDialog
        open={showCreateGroup}
        onOpenChange={setShowCreateGroup}
      />


    </div>
  );
}
