import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, X, Globe } from 'lucide-react';
import { useGroupStore } from '@/stores/groupStore';
import { useUserStore } from '@/stores/userStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { CURRENCIES, CurrencyCode, getInitials } from '@/lib/constants';

interface CreateGroupDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CreateGroupDialog({ open, onOpenChange }: CreateGroupDialogProps) {
    const navigate = useNavigate();
    const { createGroup, addMember, setActiveGroup } = useGroupStore();
    const { name: userName, defaultCurrency } = useUserStore();

    const [newGroupName, setNewGroupName] = useState('');
    const [selectedCurrency, setSelectedCurrency] = useState<CurrencyCode>(defaultCurrency as CurrencyCode);
    const [newMemberName, setNewMemberName] = useState('');
    const [tempMembers, setTempMembers] = useState<string[]>([]);
    const [showMemberStep, setShowMemberStep] = useState(false);

    const handleCloseDialog = () => {
        onOpenChange(false);
        // Reset state after a small delay for animation
        setTimeout(() => {
            setShowMemberStep(false);
            setNewGroupName('');
            setNewMemberName('');
            setTempMembers([]);
            setSelectedCurrency(defaultCurrency as CurrencyCode); // Reset to default
        }, 300);
    };

    const handleNext = () => {
        if (!newGroupName.trim()) return;
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

    const handleFinishSetup = async () => {
        if (!newGroupName.trim()) return;

        // Create new group with currency
        const group = await createGroup(newGroupName.trim(), selectedCurrency, userName);
        if (!group) return;

        // Add all temporary members
        for (const memberName of tempMembers) {
            await addMember(group.id, { name: memberName });
        }

        // Navigate to the group
        setActiveGroup(group.id);
        navigate(`/group/${group.id}`);

        // Clean up
        handleCloseDialog();
    };

    return (
        <Dialog open={open} onOpenChange={(val) => !val && handleCloseDialog()}>
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
                                onKeyDown={(e) => e.key === 'Enter' && handleNext()}
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium text-foreground mb-2 block">
                                Currency
                            </label>
                            <Select
                                value={selectedCurrency}
                                onValueChange={(val) => setSelectedCurrency(val as CurrencyCode)}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select currency" />
                                </SelectTrigger>
                                <SelectContent>
                                    {CURRENCIES.map((currency) => (
                                        <SelectItem key={currency.code} value={currency.code}>
                                            <span className="flex items-center gap-2">
                                                <span className="font-mono w-8">{currency.code}</span>
                                                <span className="text-muted-foreground">{currency.name} ({currency.symbol})</span>
                                            </span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                                <Globe className="w-3 h-3" />
                                This will be used for all expenses in this group
                            </p>
                        </div>

                        <Button
                            onClick={handleNext}
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
                            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                                {/* Show organizer (You) */}
                                <div className="flex items-center gap-3 bg-muted/50 px-3 py-2 rounded-xl">
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium text-white bg-orange-500">
                                        {getInitials(userName)}
                                    </div>
                                    <span className="flex-1 font-medium">{userName}</span>
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

                        <div className="flex gap-2 pt-2">
                            <Button
                                variant="ghost"
                                onClick={() => setShowMemberStep(false)}
                                className="flex-1"
                            >
                                Back
                            </Button>
                            <Button
                                onClick={handleFinishSetup}
                                className="flex-[2]"
                            >
                                Start Splitting
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
