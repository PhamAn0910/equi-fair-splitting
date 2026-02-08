import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MoreVertical, Plus, Check, Camera, Image as ImageIcon, Loader2, Receipt } from 'lucide-react';
import { usePaintStore, type ExpenseItem } from '@/stores/paintStore';
import { useGroupStore } from '@/stores/groupStore';
import { useExpenseStore } from '@/stores/expenseStore';
import { useSubscriptionStore } from '@/stores/subscriptionStore';
import { MemberAvatar } from '@/components/MemberAvatar';
import { ExpenseItemRow } from '@/components/ExpenseItemRow';
import { ScanConfirmDialog } from '@/components/ScanConfirmDialog';
import { UpgradeDialog } from '@/components/UpgradeDialog';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/constants';
import { useReceiptOCR } from '@/hooks/useReceiptOCR';
import { toast } from 'sonner';
import { useAuth } from '@clerk/clerk-react';

export default function ScanPaint() {
  const navigate = useNavigate();
  const { getActiveGroup } = useGroupStore();
  const activeGroup = getActiveGroup();
  const { userId, getToken } = useAuth();
  const {
    subscription,
    todayScans,
    lifetimeScans,
    isLoading: isSubscriptionLoading,
    fetchSubscription,
    getTodayScans,
    getLifetimeScans,
    incrementScan,
    canScan
  } = useSubscriptionStore();

  const {
    members,
    activeMemberId,
    items,
    fees,
    assignments,
    setActiveMember,
    setReceiptData,
    toggleAssignment,
    getItemAssignees,
    getUnassignedTotal,
    getBillTotal,
    getItemsSubtotal,
    getTotalFees,
    getMemberBreakdown,
    reset,
  } = usePaintStore();

  const { parseReceipt, isLoading: isScanning } = useReceiptOCR();
  const [hasScanned, setHasScanned] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Load subscription data on mount
  useEffect(() => {
    if (userId && getToken) {
      fetchSubscription(userId, getToken);
      getTodayScans(userId, getToken);
      getLifetimeScans(userId, getToken);
    }
  }, [userId, getToken, fetchSubscription, getTodayScans, getLifetimeScans]);

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

    // Check if user can scan before processing
    if (!canScan()) {
      setShowUpgradeDialog(true);
      event.target.value = '';
      return;
    }

    const receiptData = await parseReceipt(file);

    if (receiptData.items.length > 0) {
      setReceiptData(receiptData);
      setHasScanned(true);

      // Increment scan count after successful scan
      if (userId && getToken) {
        await incrementScan(userId, getToken);
        // Refresh scan counts
        await getTodayScans(userId, getToken);
        await getLifetimeScans(userId, getToken);
      }
    }

    // Reset file input
    event.target.value = '';
  };

  const handleTakePhoto = () => {
    // Check if user can scan before opening camera
    if (!canScan()) {
      setShowUpgradeDialog(true);
      return;
    }
    cameraInputRef.current?.click();
  };

  const handleSelectFromGallery = () => {
    // Check if user can scan before opening gallery
    if (!canScan()) {
      setShowUpgradeDialog(true);
      return;
    }
    fileInputRef.current?.click();
  };

  const handleItemTap = (itemId: string) => {
    if (!activeMemberId) return;
    toggleAssignment(itemId, activeMemberId);
  };

  const { addExpense } = useExpenseStore();

  const handleConfirmSplit = () => {
    if (!activeGroup || unassignedTotal > 0) return;
    setShowConfirmDialog(true);
  };

  const handleFinalConfirm = (data: { payerId: string; description: string; category: string }) => {
    if (!activeGroup) return;

    // Create splits from member breakdown (includes proportional fees)
    const splits = members
      .map(member => {
        const breakdown = getMemberBreakdown(member.id);
        return {
          memberId: member.id,
          value: breakdown.grandTotal,
          calculatedAmount: breakdown.grandTotal,
        };
      })
      .filter(split => split.value > 0);

    addExpense({
      groupId: activeGroup.id,
      description: data.description,
      totalAmount: billTotal,
      currency: activeGroup.currency,
      payerId: data.payerId,
      date: new Date().toISOString(),
      splitMethod: 'amounts',
      splits,
      items: items.map(i => ({
        id: i.id,
        name: i.name,
        price: i.price,
        quantity: i.quantity,
      })),
      category: data.category as 'food' | 'transport' | 'drinks' | 'shopping' | 'entertainment' | 'accommodation' | 'other',
    });

    toast.success('Expense added to group!');
    setShowConfirmDialog(false);
    reset();
    navigate(`/group/${activeGroup.id}`);
  };

  // Get member breakdowns for dialog
  const memberBreakdowns = members.map(member => {
    const breakdown = getMemberBreakdown(member.id);
    return {
      memberId: member.id,
      name: member.name,
      colorHex: member.colorHex,
      grandTotal: breakdown.grandTotal,
    };
  });

  const billTotal = getBillTotal();
  const itemsSubtotal = getItemsSubtotal();
  const totalFees = getTotalFees();
  const unassignedTotal = getUnassignedTotal();
  const assignedTotal = itemsSubtotal - unassignedTotal;
  const progressPercent = itemsSubtotal > 0 ? (assignedTotal / itemsSubtotal) * 100 : 0;
  const hasFees = totalFees !== 0;
  const planType = subscription?.planType || 'free';
  const userCanScan = canScan();

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
      <header className="border-b border-border safe-top">
        <div className="flex items-center justify-between px-4 pt-5 pb-4">
          <button
            onClick={() => {
              if (activeGroup) {
                navigate(`/group/${activeGroup.id}`);
              } else {
                navigate('/groups');
              }
            }}
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
        </div>
      </header>

      {/* Member Selector - Paint Brush Palette */}
      <div className="px-4 py-3 border-b border-border bg-card">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
            Select a person, then tap items below
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
                {isSubscriptionLoading ? (
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 text-muted-foreground animate-spin mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Loading subscription...</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-4 w-full max-w-xs">
                      <button
                        onClick={handleTakePhoto}
                        disabled={!userCanScan || isSubscriptionLoading}
                        className="aspect-square rounded-2xl bg-primary flex flex-col items-center justify-center gap-2 text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Camera className="w-8 h-8" />
                        <span className="text-sm font-medium">Take Photo</span>
                      </button>
                      <button
                        onClick={handleSelectFromGallery}
                        disabled={!userCanScan || isSubscriptionLoading}
                        className="aspect-square rounded-2xl bg-muted flex flex-col items-center justify-center gap-2 text-foreground hover:bg-muted/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ImageIcon className="w-8 h-8" />
                        <span className="text-sm font-medium">Gallery</span>
                      </button>
                    </div>
                    {!userCanScan ? (
                      <div className="text-center space-y-2">
                        <p className="text-sm font-medium text-foreground">
                          Scan limit reached
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {planType === 'free'
                            ? `You've used ${lifetimeScans}/2 lifetime scans`
                            : `You've used ${todayScans}/50 scans today`}
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowUpgradeDialog(true)}
                          className="mt-2"
                        >
                          Upgrade to Pro
                        </Button>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center">
                        Scan a receipt to extract items automatically
                      </p>
                    )}
                  </>
                )}
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
                  reset();
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

            {/* Fees Summary (non-assignable) */}
            {hasFees && (
              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Receipt className="w-4 h-4 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                    Fees (split proportionally)
                  </p>
                </div>
                <div className="space-y-1 text-sm">
                  {fees.tax > 0 && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Tax</span>
                      <span>{formatCurrency(fees.tax, activeGroup.currency)}</span>
                    </div>
                  )}
                  {fees.tip > 0 && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Tip</span>
                      <span>{formatCurrency(fees.tip, activeGroup.currency)}</span>
                    </div>
                  )}
                  {fees.service_charge > 0 && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Service Charge</span>
                      <span>{formatCurrency(fees.service_charge, activeGroup.currency)}</span>
                    </div>
                  )}
                  {fees.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>-{formatCurrency(fees.discount, activeGroup.currency)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
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
                {hasFees && (
                  <span className="text-xs text-muted-foreground ml-1">(incl. fees)</span>
                )}
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Member Breakdown - Shows items + proportional fees */}
          <div className="flex flex-col gap-2 mb-4">
            {members.map((member) => {
              const breakdown = getMemberBreakdown(member.id);
              if (breakdown.grandTotal === 0) return null;

              const hasFeesForMember = breakdown.taxShare > 0 || breakdown.tipShare > 0 ||
                breakdown.serviceShare > 0 || breakdown.discountShare > 0;

              return (
                <div key={member.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: member.colorHex }}
                    />
                    <span className="text-sm text-muted-foreground">{member.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium">
                      {formatCurrency(breakdown.grandTotal, activeGroup.currency)}
                    </span>
                    {hasFeesForMember && (
                      <span className="text-xs text-muted-foreground ml-1">
                        ({formatCurrency(breakdown.itemsTotal, activeGroup.currency)} + fees)
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Confirm Button */}
          <Button
            className="w-full gap-2"
            size="lg"
            disabled={unassignedTotal > 0}
            onClick={handleConfirmSplit}
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

      {/* Confirm Dialog */}
      <ScanConfirmDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        members={members}
        totalAmount={billTotal}
        currency={activeGroup.currency}
        memberBreakdowns={memberBreakdowns}
        onConfirm={handleFinalConfirm}
      />

      {/* Upgrade Dialog */}
      <UpgradeDialog
        open={showUpgradeDialog}
        onOpenChange={setShowUpgradeDialog}
        currentScans={planType === 'free' ? lifetimeScans : todayScans}
        planType={planType}
        isLifetimeScans={planType === 'free'}
      />
    </div>
  );
}
