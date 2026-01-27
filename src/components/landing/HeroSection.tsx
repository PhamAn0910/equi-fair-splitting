import { motion } from "framer-motion";

const HeroSection = () => {
  return (
    <section className="min-h-screen pt-32 pb-16 px-4 md:px-8 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background gradient blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-secondary/20 rounded-full blur-[100px]" />
      <div className="absolute bottom-[10%] right-[-10%] w-[40vw] h-[40vw] bg-accent/20 rounded-full blur-[100px]" />

      {/* Hero content */}
      <div className="max-w-4xl w-full text-center relative z-10 mb-12">
        <motion.span
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="inline-block py-1 px-4 rounded-full border border-border bg-card/40 backdrop-blur-sm text-sm font-medium mb-6 animate-float"
        >
          ✨ Splitting bills just got cozy
        </motion.span>
        
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-6xl md:text-8xl lg:text-9xl font-display font-medium tracking-tight leading-[0.9] mb-8"
        >
          The art of <br />
          <span className="italic text-primary">fair</span> splitting.
        </motion.h1>
        
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
        >
          Where finances meet friendship. Track expenses, settle up, and keep the good vibes flowing without the awkward math.
        </motion.p>
      </div>

      {/* Hero visual card */}
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, delay: 0.5 }}
        className="relative w-full max-w-[1000px] h-[500px] md:h-[600px] bg-gradient-to-br from-card/40 to-card/10 backdrop-blur-xl border border-card/40 rounded-[3rem] shadow-2xl flex items-center justify-center overflow-hidden group"
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-secondary/10 via-transparent to-accent/10" />
        
        {/* Receipt card */}
        <div className="relative w-[320px] bg-card/90 shadow-2xl rounded-2xl p-6 transform transition-transform duration-700 hover:scale-105 hover:-rotate-2 z-20">
          <div className="flex justify-between items-center mb-6 border-b border-dashed border-border pb-4">
            <div className="w-10 h-10 bg-foreground rounded-full flex items-center justify-center text-background font-display font-bold">
              E
            </div>
            <div className="text-right">
              <div className="text-xs uppercase text-muted-foreground font-bold tracking-wider">
                Receipt #042
              </div>
              <div className="text-sm font-medium">Sushi Night 🍣</div>
            </div>
          </div>
          
          <div className="space-y-4 mb-6">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Spicy Tuna Roll</span>
              <span className="font-medium">$12.00</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Dragon Roll (x2)</span>
              <span className="font-medium">$28.00</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Sake Bottle</span>
              <span className="font-medium">$45.00</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Miso Soup</span>
              <span className="font-medium">$6.00</span>
            </div>
          </div>
          
          <div className="pt-4 border-t border-border flex justify-between items-center">
            <span className="font-display font-bold text-lg">Total</span>
            <span className="font-display font-bold text-2xl">$91.00</span>
          </div>
          
          {/* Decorative curves */}
          <svg className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-full pointer-events-none opacity-80" viewBox="0 0 200 200">
            <path
              className="mix-blend-multiply dark:mix-blend-screen opacity-60"
              d="M20,100 Q60,60 100,100 T180,100"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeLinecap="round"
              strokeWidth="12"
            />
            <path
              className="mix-blend-multiply dark:mix-blend-screen opacity-60"
              d="M30,120 Q70,80 110,120 T190,120"
              fill="none"
              stroke="hsl(var(--accent))"
              strokeLinecap="round"
              strokeWidth="12"
            />
          </svg>
        </div>

        {/* Floating avatars - hidden on mobile to avoid overlap */}
        <div className="hidden md:block absolute top-20 left-20 animate-float" style={{ animationDelay: "1s" }}>
          <img
            alt="User Avatar 1"
            className="w-16 h-16 rounded-full object-cover border-4 border-card shadow-lg"
            src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face"
          />
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-xs font-bold shadow-sm whitespace-nowrap">
            Paid $45
          </div>
        </div>

        <div className="hidden md:block absolute bottom-20 right-20 animate-float" style={{ animationDelay: "2s" }}>
          <img
            alt="User Avatar 2"
            className="w-16 h-16 rounded-full object-cover border-4 border-card shadow-lg"
            src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face"
          />
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-bold shadow-sm whitespace-nowrap">
            Owes $22
          </div>
        </div>

        {/* Background blur circles */}
        <div className="absolute -left-10 top-1/2 w-48 h-48 bg-accent rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-pulse" />
        <div
          className="absolute -right-10 bottom-1/4 w-56 h-56 bg-secondary rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-pulse"
          style={{ animationDelay: "1s" }}
        />
      </motion.div>
    </section>
  );
};

export default HeroSection;
