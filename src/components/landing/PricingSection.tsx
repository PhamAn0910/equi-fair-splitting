import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const PricingSection = () => {
  return (
    <section className="py-24 px-4 md:px-8 max-w-[1400px] mx-auto" id="pricing">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        viewport={{ once: true }}
        className="text-center mb-16"
      >
        <h2 className="text-5xl font-display font-medium mb-4">Plans for everyone.</h2>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {/* Free Plan */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="bg-card p-8 md:p-12 rounded-[2.5rem] shadow-sm border border-border hover:border-secondary/50 transition-colors"
        >
          <h3 className="text-2xl font-display font-bold mb-2">Free</h3>
          <div className="text-4xl font-bold mb-6">
            $0<span className="text-lg text-muted-foreground font-normal">/forever</span>
          </div>
          <ul className="space-y-4 mb-8 text-muted-foreground">
            <li className="flex items-center gap-3">
              <Check className="w-5 h-5 text-secondary" />
              Unlimited Groups
            </li>
            <li className="flex items-center gap-3">
              <Check className="w-5 h-5 text-secondary" />
              Standard Bill Splitting
            </li>
            <li className="flex items-center gap-3">
              <Check className="w-5 h-5 text-secondary" />
              Basic Export
            </li>
          </ul>
          <Button variant="outline" className="w-full py-6 rounded-xl font-bold">
            Get Started
          </Button>
        </motion.div>

        {/* Pro Plan */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          viewport={{ once: true }}
          className="bg-foreground text-background p-8 md:p-12 rounded-[2.5rem] shadow-xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-4 py-2 rounded-bl-xl">
            POPULAR
          </div>
          <h3 className="text-2xl font-display font-bold mb-2">Equi Pro</h3>
          <div className="text-4xl font-bold mb-6">
            $4.99<span className="text-lg text-muted font-normal">/mo</span>
          </div>
          <ul className="space-y-4 mb-8 text-muted">
            <li className="flex items-center gap-3">
              <Check className="w-5 h-5 text-primary" />
              Everything in Free
            </li>
            <li className="flex items-center gap-3">
              <Check className="w-5 h-5 text-primary" />
              AI Receipt Scanning
            </li>
            <li className="flex items-center gap-3">
              <Check className="w-5 h-5 text-primary" />
              Recurring Bills
            </li>
            <li className="flex items-center gap-3">
              <Check className="w-5 h-5 text-primary" />
              Custom Categories
            </li>
          </ul>
          <Button className="w-full py-6 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 shadow-lg shadow-primary/20">
            Go Pro
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default PricingSection;
