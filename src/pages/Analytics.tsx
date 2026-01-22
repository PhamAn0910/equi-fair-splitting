
import { useNavigate } from "react-router-dom";
import { ArrowLeft, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Analytics() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center">
            <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center mb-6">
                <BarChart3 className="w-10 h-10 text-accent" />
            </div>

            <h1 className="text-3xl font-bold text-foreground mb-2">Analytics</h1>
            <p className="text-xl font-medium text-foreground/80 mb-4">Coming Soon</p>

            <p className="text-muted-foreground max-w-sm mb-8">
                We're working hard to bring you detailed insights about your spending habits. Stay tuned!
            </p>

            <Button
                onClick={() => navigate(-1)}
                variant="outline"
                className="gap-2"
            >
                <ArrowLeft className="w-4 h-4" />
                Go Back
            </Button>
        </div>
    );
}
