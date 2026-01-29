import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useUser } from '@clerk/clerk-react';
import { ChevronLeft, Send, MessageSquare, Loader2, Bug, Lightbulb, MessageCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createSupabaseClient } from '@/lib/supabase/client';

export default function Feedback() {
    const navigate = useNavigate();
    const { userId, getToken } = useAuth();
    const { user } = useUser();
    const { toast } = useToast();

    const [message, setMessage] = useState('');
    const [type, setType] = useState('general');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!message.trim()) {
            toast({
                title: "Please enter a message",
                variant: "destructive",
            });
            return;
        }

        if (!userId) {
            toast({
                title: "You must be logged in to submit feedback",
                variant: "destructive",
            });
            return;
        }

        setIsSubmitting(true);

        try {
            const supabase = await createSupabaseClient(getToken);

            const { error } = await supabase.from('feedback').insert({
                user_id: userId,
                message: message.trim(),
                type: type
            }).select();

            if (error) throw error;

            toast({
                title: "Feedback sent!",
                description: "Thank you for helping us improve.",
            });

            setMessage('');
            setType('general');

            // Optional: Navigate back after success or just let them stay
            setTimeout(() => navigate('/account'), 1500);

        } catch (error) {
            console.error("Error submitting feedback:", error);
            toast({
                title: "Failed to send feedback",
                description: "Please try again later.",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const getIconForType = (t: string) => {
        switch (t) {
            case 'bug': return <Bug className="w-4 h-4" />;
            case 'feature': return <Lightbulb className="w-4 h-4" />;
            default: return <MessageCircle className="w-4 h-4" />;
        }
    };

    return (
        <div className="min-h-screen bg-background pb-24">
            <header className="px-4 pt-6 pb-6 safe-top sticky top-0 bg-background/80 backdrop-blur-lg z-10 border-b border-border/50">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/account')}
                        className="p-2 -ml-2 hover:bg-muted rounded-full transition-colors"
                    >
                        <ChevronLeft className="w-6 h-6 text-foreground" />
                    </button>
                    <h1 className="text-xl font-bold text-foreground">Send Feedback</h1>
                </div>
            </header>

            <main className="px-4 py-6 max-w-md mx-auto">
                <div className="mb-6">
                    <p className="text-muted-foreground">
                        We'd love to hear from you! Whether it's a bug report, a feature request, or just general thoughts, your feedback helps us make the app better.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">

                    <div className="space-y-3">
                        <label className="text-sm font-medium text-foreground">Feedback Type</label>
                        <div className="grid grid-cols-3 gap-3">
                            {['general', 'feature', 'bug'].map((t) => (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => setType(t)}
                                    className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border transition-all ${type === t
                                        ? 'bg-primary/10 border-primary text-primary'
                                        : 'bg-card border-border text-muted-foreground hover:bg-muted'
                                        }`}
                                >
                                    {getIconForType(t)}
                                    <span className="text-xs font-medium capitalize">{t}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="message" className="text-sm font-medium text-foreground">Your Message</label>
                        <textarea
                            id="message"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Tell us what's on your mind..."
                            className="w-full min-h-[150px] p-4 rounded-xl bg-card border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none transition-all placeholder:text-muted-foreground/50"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting || !message.trim()}
                        className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-bold text-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Sending...
                            </>
                        ) : (
                            <>
                                <Send className="w-5 h-5" />
                                Send Feedback
                            </>
                        )}
                    </button>
                </form>
            </main>
        </div>
    );
}
