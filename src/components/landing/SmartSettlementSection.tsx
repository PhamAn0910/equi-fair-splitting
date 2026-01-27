import { motion } from "framer-motion";
import { Sparkles, ArrowRight } from "lucide-react";

const SmartSettlementSection = () => {
  return (
    <div className="w-full">
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
          className="text-xl text-muted-foreground/80"
        >
          We do the debt simplification math so you make fewer transfers.
        </motion.p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        viewport={{ once: true }}
        className="max-w-5xl mx-auto bg-card rounded-[3rem] p-12 shadow-xl border border-border/50 relative"
      >
        <div className="flex flex-col md:flex-row justify-between items-center gap-12 relative z-10">
          {/* Complex Reality - Left side */}
          <div className="flex flex-col gap-4 w-full md:w-1/3 opacity-40 blur-[1px] hover:opacity-100 transition-opacity duration-500">
            <div className="bg-muted p-4 rounded-xl flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-border" />
                <span className="font-medium text-muted-foreground">Anna</span>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground/50" />
              <div className="flex items-center gap-2">
                <span className="font-medium text-muted-foreground">Ben</span>
                <div className="w-6 h-6 rounded-full bg-border" />
              </div>
            </div>
            <div className="bg-muted p-4 rounded-xl flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-border" />
                <span className="font-medium text-muted-foreground">Ben</span>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground/50" />
              <div className="flex items-center gap-2">
                <span className="font-medium text-muted-foreground">Chris</span>
                <div className="w-6 h-6 rounded-full bg-border" />
              </div>
            </div>
            <div className="bg-muted p-4 rounded-xl flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-border" />
                <span className="font-medium text-muted-foreground">Chris</span>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground/50" />
              <div className="flex items-center gap-2">
                <span className="font-medium text-muted-foreground">Anna</span>
                <div className="w-6 h-6 rounded-full bg-border" />
              </div>
            </div>
            <div className="text-center text-xs font-bold uppercase tracking-wider mt-2 text-muted-foreground/60">
              Complex Reality
            </div>
          </div>

          {/* Magic button - Center */}
          <div className="bg-gradient-to-br from-secondary to-secondary/80 rounded-full p-6 text-secondary-foreground shadow-xl z-20 scale-110">
            <Sparkles className="w-8 h-8 animate-pulse" />
          </div>

          {/* Equi Simple - Right side */}
          <div className="w-full md:w-1/3">
            <div className="bg-card border border-border p-6 rounded-2xl flex items-center justify-between shadow-2xl transform scale-105">
              <div className="flex flex-col items-center">
                <img
                  className="w-14 h-14 rounded-full mb-2 ring-2 ring-offset-2 ring-secondary/20"
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=face"
                  alt="Anna"
                />
                <span className="font-bold text-sm">Anna</span>
              </div>
              <div className="flex flex-col items-center flex-1 px-4">
                <span className="text-xs text-muted-foreground font-extrabold uppercase mb-1 tracking-wider">Pays</span>
                <div className="h-[2px] w-full bg-secondary/30 relative rounded-full overflow-hidden">
                  <div className="absolute inset-0 bg-secondary animate-in slide-in-from-left duration-1000" />
                </div>
                <span className="text-2xl font-black mt-1 font-display tracking-tight text-foreground">$15.00</span>
              </div>
              <div className="flex flex-col items-center">
                <img
                  className="w-14 h-14 rounded-full mb-2 ring-2 ring-offset-2 ring-secondary/20"
                  src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face"
                  alt="Chris"
                />
                <span className="font-bold text-sm">Chris</span>
              </div>
            </div>
            <div className="text-center text-xs font-bold uppercase tracking-wider mt-6 text-secondary-foreground/80">
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
        className="max-w-4xl mx-auto mt-12 grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {[
          { name: "Equal", desc: "Split equally", active: true },
          { name: "Shares", desc: "By ownership", active: false },
          { name: "%", desc: "By percentage", active: false },
          { name: "Amount", desc: "Exact values", active: false },
        ].map((method) => (
          <div
            key={method.name}
            className={`py-4 px-6 rounded-2xl text-center border transition-all duration-300 ${method.active
              ? "bg-secondary text-secondary-foreground shadow-lg border-secondary scale-105"
              : "bg-card text-muted-foreground border-border hover:border-secondary/50 hover:shadow-md"
              }`}
          >
            <div className={`font-bold text-lg mb-1 ${!method.active && "text-foreground"}`}>{method.name}</div>
            <div className={`text-xs ${method.active ? "text-secondary-foreground/80" : "text-muted-foreground"}`}>{method.desc}</div>
          </div>
        ))}
      </motion.div>
    </div>
  );
};

export default SmartSettlementSection;
