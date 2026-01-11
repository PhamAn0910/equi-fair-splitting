import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MoreVertical, Plus, Check, Camera, Image as ImageIcon, Loader2 } from 'lucide-react';
import { usePaintStore, type ExpenseItem } from '@/stores/paintStore';
import { useGroupStore } from '@/stores/groupStore';
import { MemberAvatar } from '@/components/MemberAvatar';
import { ExpenseItemRow } from '@/components/ExpenseItemRow';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/constants';
import { useReceiptOCR } from '@/hooks/useReceiptOCR';

export default function ScanPaint() {
  const navigate = useNavigate();
  const { getActiveGroup } = useGroupStore();
  const activeGroup = getActiveGroup();

  const {
    members,
    activeMemberId,
    items,
    assignments,
    setActiveMember,
    setItems,
    toggleAssignment,
    getItemAssignees,
    getUnassignedTotal,
    getBillTotal,
    getMemberTotal,
    reset,
  } = usePaintStore();

  const { parseReceipt, isLoading: isScanning } = useReceiptOCR();
  const [hasScanned, setHasScanned] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Initialize with group members
  useEffect(() => {
    if (activeGroup) {
      reset();
      activeGroup.members.forEach(member => {
        usePaintStore.getState().addMember({
          id: member.id,
          name: member.name,
          color: member.color,
          colorHex: member.colorHex,
          isAdmin: member.isAdmin,
        });
      });
      // Set first member as active by default
      if (activeGroup.members.length > 0) {
        setActiveMember(activeGroup.members[0].id);
      }
    }
  }, [activeGroup]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const parsedItems = await parseReceipt(file);
    
    if (parsedItems.length > 0) {
      const expenseItems: ExpenseItem[] = parsedItems.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      }));
      setItems(expenseItems);
      setHasScanned(true);
    }
    
    // Reset file input
    event.target.value = '';
  };

  const handleTakePhoto = () => {
    cameraInputRef.current?.click();
  };

  const handleSelectFromGallery = () => {
    fileInputRef.current?.click();
  };

  const handleItemTap = (itemId: string) => {
    if (!activeMemberId) return;
    toggleAssignment(itemId, activeMemberId);
  };

  const billTotal = getBillTotal();
  const unassignedTotal = getUnassignedTotal();
  const assignedTotal = billTotal - unassignedTotal;
  const progressPercent = billTotal > 0 ? (assignedTotal / billTotal) * 100 : 0;

  if (!activeGroup) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <p className="text-muted-foreground mb-4">No active group selected</p>
        <Button onClick={() => navigate('/')}>Go to Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-border safe-top">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 rounded-lg hover:bg-muted transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="text-center">
          <h1 className="font-semibold text-foreground">{activeGroup.name}</h1>
          <p className="text-xs text-muted-foreground">Scan Receipt</p>
        </div>
        <button className="p-2 -mr-2 rounded-lg hover:bg-muted transition-colors">
          <MoreVertical className="w-5 h-5" />
        </button>
      </header>

      {/* Member Selector - Paint Brush Palette */}
      <div className="px-4 py-3 border-b border-border bg-card">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
            Tap to paint →
          </p>
        </div>
        <div className="flex items-center gap-3 overflow-x-auto pb-1">
          {members.map((member) => (
            <MemberAvatar
              key={member.id}
              name={member.name}
              colorHex={member.colorHex}
              size="lg"
              isActive={activeMemberId === member.id}
              showName
              onClick={() => setActiveMember(member.id)}
            />
          ))}
          <button className="flex-shrink-0 w-12 h-12 rounded-full border-2 border-dashed border-border flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors">
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-4 py-4">
        {!hasScanned ? (
          /* Scan CTA */
          <div className="h-full flex flex-col items-center justify-center gap-4">
            {isScanning ? (
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
                <p className="font-medium text-foreground">Scanning receipt...</p>
                <p className="text-sm text-muted-foreground">Extracting items with AI</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4 w-full max-w-xs">
                  <button
                    onClick={handleTakePhoto}
                    className="aspect-square rounded-2xl bg-primary flex flex-col items-center justify-center gap-2 text-primary-foreground hover:opacity-90 transition-opacity"
                  >
                    <Camera className="w-8 h-8" />
                    <span className="text-sm font-medium">Take Photo</span>
                  </button>
                  <button
                    onClick={handleSelectFromGallery}
                    className="aspect-square rounded-2xl bg-muted flex flex-col items-center justify-center gap-2 text-foreground hover:bg-muted/80 transition-colors"
                  >
                    <ImageIcon className="w-8 h-8" />
                    <span className="text-sm font-medium">Gallery</span>
                  </button>
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Scan a receipt to extract items automatically
                </p>
              </>
            )}
          </div>
        ) : (
          /* Item List */
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-muted-foreground">
                {items.length} items found
              </p>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  setHasScanned(false);
                  setItems([]);
                }}
              >
                Scan Again
              </Button>
            </div>
            {items.map((item) => {
              const assignees = getItemAssignees(item.id);
              return (
                <ExpenseItemRow
                  key={item.id}
                  name={item.name}
                  price={item.price}
                  quantity={item.quantity}
                  currency={activeGroup.currency}
                  assignees={assignees}
                  onClick={() => handleItemTap(item.id)}
                />
              );
            })}
          </div>
        )}
      </main>

      {/* Footer - Progress & Confirm */}
      {hasScanned && (
        <footer className="border-t border-border p-4 bg-card safe-bottom">
          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">
                UNASSIGNED: <span className="text-foreground font-medium">{formatCurrency(unassignedTotal, activeGroup.currency)}</span>
              </span>
              <span className="text-muted-foreground">
                TOTAL: <span className="text-foreground font-medium">{formatCurrency(billTotal, activeGroup.currency)}</span>
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Member Breakdown - Quick Preview */}
          <div className="flex items-center justify-between gap-2 mb-4 overflow-x-auto pb-2">
            {members.map((member) => {
              const total = getMemberTotal(member.id);
              if (total === 0) return null;
              return (
                <div key={member.id} className="flex items-center gap-2 flex-shrink-0">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: member.colorHex }}
                  />
                  <span className="text-sm text-muted-foreground">{member.name}:</span>
                  <span className="text-sm font-medium">{formatCurrency(total, activeGroup.currency)}</span>
                </div>
              );
            })}
          </div>

          {/* Confirm Button */}
          <Button 
            className="w-full gap-2"
            size="lg"
            disabled={unassignedTotal > 0}
          >
            {unassignedTotal > 0 ? (
              `Assign remaining ${formatCurrency(unassignedTotal, activeGroup.currency)}`
            ) : (
              <>
                Confirm Split
                <Check className="w-4 h-4" />
              </>
            )}
          </Button>
        </footer>
      )}
    </div>
  );
}
