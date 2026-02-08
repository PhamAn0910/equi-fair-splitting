import { useState, useEffect } from 'react';
import { MemberAvatar } from '@/components/MemberAvatar';
import { UpgradeDialog } from '@/components/UpgradeDialog';
import { useSubscriptionStore } from '@/stores/subscriptionStore';
import { Settings, CreditCard, LogOut, ChevronRight, Sparkles, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUser, useClerk, useAuth } from '@clerk/clerk-react';

export default function Account() {
  const navigate = useNavigate();
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const { getToken, userId } = useAuth();

  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);

  const { subscription, todayScans, lifetimeScans, fetchSubscription, getTodayScans, getLifetimeScans } = useSubscriptionStore();

  // Fetch subscription and scan count on mount
  useEffect(() => {
    if (userId && getToken) {
      fetchSubscription(userId, getToken);
      getTodayScans(userId, getToken);
      getLifetimeScans(userId, getToken);
    }
  }, [userId, getToken, fetchSubscription, getTodayScans, getLifetimeScans]);

  const planType = subscription?.planType || 'free';

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  // Get user info from Clerk
  const userName = user?.firstName || user?.username || 'User';
  const userEmail = user?.primaryEmailAddress?.emailAddress || '';
  const userImage = user?.imageUrl;

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="safe-top">
        <div className="px-4 pt-5 pb-6 flex items-center gap-4">
          {userImage ? (
            <img
              src={userImage}
              alt={userName}
              className="w-16 h-16 rounded-full object-cover"
            />
          ) : (
            <MemberAvatar name={userName} colorHex="#6B7B5F" size="xl" />
          )}
          <div>
            <h1 className="text-xl font-bold text-foreground">
              {isLoaded ? userName : 'Loading...'}
            </h1>
            <p className="text-muted-foreground">{userEmail}</p>
          </div>
        </div>
      </header>

      {/* Subscription Banner */}
      <div className="px-4 mb-4">
        <button
          onClick={() => setShowUpgradeDialog(true)}
          className="w-full p-4 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-between hover:bg-primary/15 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div className="text-left">
              <p className="font-medium text-foreground">
                {planType === 'free' ? 'Start 3-Day Free Trial' : `${planType.charAt(0).toUpperCase() + planType.slice(1)} Plan`}
              </p>
              <p className="text-sm text-muted-foreground">
                {planType === 'free'
                  ? `${Math.min(lifetimeScans, 2)}/2 scans used (lifetime)`
                  : `${Math.min(todayScans, 50)}/50 scans used today`}
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-primary" />
        </button>
      </div>

      <main className="px-4 space-y-2">
        <button
          onClick={() => navigate('/settings')}
          className="w-full flex items-center gap-4 p-4 bg-card rounded-xl hover:bg-muted transition-colors"
        >
          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
            <Settings className="w-5 h-5 text-foreground" />
          </div>
          <div className="flex-1 text-left">
            <p className="font-medium text-foreground">Settings</p>
            <p className="text-sm text-muted-foreground">App preferences</p>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </button>

        <button
          onClick={() => setShowUpgradeDialog(true)}
          className="w-full flex items-center gap-4 p-4 bg-card rounded-xl hover:bg-muted transition-colors"
        >
          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-foreground" />
          </div>
          <div className="flex-1 text-left">
            <p className="font-medium text-foreground">Subscription</p>
            <p className="text-sm text-muted-foreground">
              Current: {planType.charAt(0).toUpperCase() + planType.slice(1)}
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </button>

        <button
          onClick={() => navigate('/feedback')}
          className="w-full flex items-center gap-4 p-4 bg-card rounded-xl hover:bg-muted transition-colors"
        >
          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-foreground" />
          </div>
          <div className="flex-1 text-left">
            <p className="font-medium text-foreground">Feedback</p>
            <p className="text-sm text-muted-foreground">Help us improve</p>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </button>

        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-4 p-4 bg-card rounded-xl hover:bg-destructive/10 transition-colors mt-6"
        >
          <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
            <LogOut className="w-5 h-5 text-destructive" />
          </div>
          <div className="flex-1 text-left">
            <p className="font-medium text-destructive">Sign Out</p>
          </div>
        </button>
      </main>

      {/* Upgrade Dialog */}
      <UpgradeDialog
        open={showUpgradeDialog}
        onOpenChange={setShowUpgradeDialog}
        currentScans={planType === 'free' ? lifetimeScans : todayScans}
        planType={planType}
        isLifetimeScans={planType === 'free'}
        subscriptionStatus={subscription?.status}
        cancelledAt={subscription?.cancelledAt}
        trialEndsAt={subscription?.trialEndsAt}
      />
    </div>
  );
}

