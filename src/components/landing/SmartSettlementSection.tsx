import { motion } from "framer-motion";
import { Sparkles, ArrowRight } from "lucide-react";

const SmartSettlementSection = () => {
  return (
    <section className="py-24 px-4 md:px-8 bg-background">
      <div className="max-w-4xl mx-auto text-center mb-16">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-4xl md:text-6xl font-display font-medium mb-6"
        >
          Smart Settlement
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          viewport={{ once: true }}
          className="text-xl text-muted-foreground"
        >
          We do the debt simplification math so you make fewer transfers.
        </motion.p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        viewport={{ once: true }}
        className="max-w-5xl mx-auto bg-card rounded-[3rem] p-12 shadow-xl border border-border relative"
      >
        <div className="flex flex-col md:flex-row justify-between items-center gap-12 relative z-10">
          {/* Complex Reality - Left side */}
          <div className="flex flex-col gap-4 w-full md:w-1/3 opacity-50 blur-[1px]">
            <div className="bg-muted p-4 rounded-xl flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-border" />
                <span>Anna</span>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
              <div className="flex items-center gap-2">
                <span>Ben</span>
                <div className="w-6 h-6 rounded-full bg-border" />
              </div>
            </div>
            <div className="bg-muted p-4 rounded-xl flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-border" />
                <span>Ben</span>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
              <div className="flex items-center gap-2">
                <span>Chris</span>
                <div className="w-6 h-6 rounded-full bg-border" />
              </div>
            </div>
            <div className="bg-muted p-4 rounded-xl flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-border" />
                <span>Chris</span>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
              <div className="flex items-center gap-2">
                <span>Anna</span>
                <div className="w-6 h-6 rounded-full bg-border" />
              </div>
            </div>
            <div className="text-center text-xs font-bold uppercase tracking-wider mt-2">
              Complex Reality
            </div>
          </div>

          {/* Magic button - Center */}
          <div className="bg-secondary rounded-full p-4 text-secondary-foreground shadow-lg z-20">
            <Sparkles className="w-8 h-8" />
          </div>

          {/* Equi Simple - Right side */}
          <div className="w-full md:w-1/3">
            <div className="bg-secondary/10 border-2 border-secondary p-6 rounded-2xl flex items-center justify-between shadow-lg transform scale-110 bg-card">
              <div className="flex flex-col items-center">
                <img
                  className="w-12 h-12 rounded-full mb-2"
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=face"
                  alt="Anna"
                />
                <span className="font-bold text-sm">Anna</span>
              </div>
              <div className="flex flex-col items-center flex-1 px-4">
                <span className="text-xs text-secondary font-bold uppercase mb-1">Pays</span>
                <div className="h-[2px] w-full bg-secondary relative">
                  <div className="absolute right-0 -top-[5px] w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-l-[8px] border-l-secondary" />
                </div>
                <span className="text-lg font-bold mt-1">$15.00</span>
              </div>
              <div className="flex flex-col items-center">
                <img
                  className="w-12 h-12 rounded-full mb-2"
                  src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face"
                  alt="Chris"
                />
                <span className="font-bold text-sm">Chris</span>
              </div>
            </div>
            <div className="text-center text-xs font-bold uppercase tracking-wider mt-6 text-secondary">
              Equi Simple
            </div>
          </div>
        </div>
      </motion.div>

      {/* Split Methods Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        viewport={{ once: true }}
        className="max-w-3xl mx-auto mt-8 grid grid-cols-2 md:grid-cols-4 gap-3"
      >
        {[
          { name: "Equal", active: true },
          { name: "Shares", active: false },
          { name: "%", active: false },
          { name: "Amount", active: false },
        ].map((method, index) => (
          <div
            key={method.name}
            className={`py-3 px-6 rounded-full text-center font-medium text-sm transition-all ${
              method.active
                ? "bg-secondary text-secondary-foreground shadow-md"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {method.name}
          </div>
        ))}
      </motion.div>
    </section>
  );
};

export default SmartSettlementSection;
