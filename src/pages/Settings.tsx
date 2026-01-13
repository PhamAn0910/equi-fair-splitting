import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useSettingsStore, type OCRModel } from '@/stores/settingsStore';
import { Brain, Sparkles, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function Settings() {
  const navigate = useNavigate();
  const { ocrModel, setOCRModel } = useSettingsStore();

  const handleModelChange = (value: string) => {
    const newModel = value as OCRModel;
    setOCRModel(newModel);
    toast.success(`Switched to ${newModel === 'gemini' ? 'Gemini' : 'Qwen'} model`);
  };

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
            <h2 className="text-lg font-semibold text-foreground">OCR Model Selection</h2>
          </div>
          
          <p className="text-sm text-muted-foreground mb-6">
            Choose which AI model to use for scanning receipts and invoices. You can switch between models to compare accuracy.
          </p>

          <RadioGroup value={ocrModel} onValueChange={handleModelChange} className="space-y-4">
            <div className="flex items-start space-x-3 p-4 rounded-lg border border-border hover:border-primary transition-colors">
              <RadioGroupItem value="qwen" id="qwen" className="mt-1" />
              <Label htmlFor="qwen" className="flex-1 cursor-pointer space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">Qwen 2.5 VL 7B Instruct</span>
                  <span className="text-xs bg-green-500/10 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full">
                    Free
                  </span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Alibaba's vision-language model via OpenRouter. Good balance of speed and accuracy for multilingual receipts.
                </p>
              </Label>
            </div>

            <div className="flex items-start space-x-3 p-4 rounded-lg border border-border hover:border-primary transition-colors">
              <RadioGroupItem value="gemini" id="gemini" className="mt-1" />
              <Label htmlFor="gemini" className="flex-1 cursor-pointer space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">Gemini 2.5 Flash Image</span>
                  <Sparkles className="w-4 h-4 text-amber-500" />
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Google's latest image-optimized model. Superior OCR accuracy with native JSON output. Excellent for complex receipts.
                </p>
              </Label>
            </div>
          </RadioGroup>

          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Current model:</strong> {ocrModel === 'gemini' ? 'Gemini 2.5 Flash Image' : 'Qwen 2.5 VL 7B Instruct'}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Make sure you have the corresponding API key configured in your environment variables.
            </p>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-medium text-foreground mb-3">API Key Configuration</h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• <strong>Qwen:</strong> Requires VITE_OPENROUTER_API_KEY from <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">openrouter.ai/keys</a></p>
            <p>• <strong>Gemini:</strong> Requires VITE_GEMINI_API_KEY from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google AI Studio</a></p>
          </div>
        </Card>
      </main>

      <BottomNav />
    </div>
  );
}
