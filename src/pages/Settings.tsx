import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Brain } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Settings() {
  const navigate = useNavigate();

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
            <Brain className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">AI Configuration</h2>
          </div>

          <p className="text-sm text-muted-foreground mb-6">
            The app automatically uses the best available AI model for receipt scanning.
          </p>

          <div className="p-4 bg-muted/50 rounded-lg space-y-3">
            <p className="text-sm font-medium text-foreground">
              How it works
            </p>
            <p className="text-sm text-muted-foreground">
              1. <strong>Primary:</strong> Gemini 2.5 Flash (Fast & Accurate)
            </p>
            <p className="text-sm text-muted-foreground">
              2. <strong>Fallback:</strong> Qwen 2.5 VL (Reliable Backup)
            </p>
            <p className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border">
              If the primary model is busy or rate-limited, the system will automatically switch to the fallback model.
            </p>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-medium text-foreground mb-3">API Key Configuration</h3>
          <div className="space-y-4 text-sm text-muted-foreground">
            <p>
              To ensure uninterrupted service, please configure both API keys in your environment variables:
            </p>
            <div className="space-y-2">
              <p>• <strong>Gemini (Primary):</strong> Requires VITE_GEMINI_API_KEY from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google AI Studio</a></p>
              <p>• <strong>Qwen (Fallback):</strong> Requires VITE_OPENROUTER_API_KEY from <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">openrouter.ai/keys</a></p>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
}
