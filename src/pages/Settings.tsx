import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, User as UserIcon, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '@/stores/userStore';
import { CURRENCIES } from '@/lib/constants';

export default function Settings() {
  const navigate = useNavigate();
  const { name, setName, defaultCurrency, setDefaultCurrency } = useUserStore();

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="px-4 pt-6 pb-4 safe-top border-b border-border">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/account')}
            className="rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        </div>
      </header>

      <main className="px-4 py-6 space-y-6">
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <UserIcon className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">User Profile</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Your Name
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
              />
              <p className="text-xs text-muted-foreground mt-1.5">
                This name will be used when you create new groups.
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Default Currency</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Currency
              </label>
              <Select
                value={defaultCurrency}
                onValueChange={(val) => setDefaultCurrency(val)}
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
              <p className="text-xs text-muted-foreground mt-1.5">
                This currency will be selected by default when creating new groups.
              </p>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
}
