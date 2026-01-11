import { useState } from 'react';
import { Plus, X, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useGroupStore, type Group } from '@/stores/groupStore';

interface AddMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: Group;
}

export function AddMemberDialog({ open, onOpenChange, group }: AddMemberDialogProps) {
  const { addMember, removeMember } = useGroupStore();
  const [newMemberName, setNewMemberName] = useState('');

  const handleAddMember = () => {
    if (!newMemberName.trim()) return;
    addMember(group.id, newMemberName.trim());
    setNewMemberName('');
  };

  const handleRemoveMember = (memberId: string) => {
    removeMember(group.id, memberId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Manage Members
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current members */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Members ({group.members.length})
            </label>
            <div className="space-y-2">
              {group.members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl"
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium text-white"
                    style={{ backgroundColor: member.colorHex }}
                  >
                    {member.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{member.name}</p>
                    {member.isAdmin && (
                      <p className="text-xs text-muted-foreground">Organizer</p>
                    )}
                  </div>
                  {!member.isAdmin && (
                    <button 
                      onClick={() => handleRemoveMember(member.id)}
                      className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Add member input */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Add new member
            </label>
            <div className="flex gap-2">
              <Input
                placeholder="Enter name..."
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddMember()}
              />
              <Button 
                onClick={handleAddMember}
                disabled={!newMemberName.trim()}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <Button 
            onClick={() => onOpenChange(false)} 
            className="w-full"
          >
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
