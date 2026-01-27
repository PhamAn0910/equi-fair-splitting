import { motion } from "framer-motion";
import { Heart, Palette } from "lucide-react";
const VibeSection = () => {
  return <section className="py-20 relative overflow-hidden bg-secondary" id="vibe">
    <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-card to-transparent" />
    <div className="absolute right-[-10%] top-[-20%] w-[80vw] h-[80vw] rounded-full bg-secondary/80 shadow-2xl opacity-50 blur-3xl" />

    <div className="max-w-[1400px] mx-auto px-4 md:px-8 relative z-10 grid lg:grid-cols-2 gap-12 items-center">
      <motion.div initial={{
        opacity: 0,
        x: -20
      }} whileInView={{
        opacity: 1,
        x: 0
      }} transition={{
        duration: 0.5
      }} viewport={{
        once: true
      }}>
        <span className="text-accent font-bold tracking-widest uppercase text-sm mb-4 block">
          The Vibe
        </span>
        <h2 className="text-5xl md:text-7xl font-display font-medium mb-8 leading-tight text-secondary-foreground">
          More than just <br /> numbers.
        </h2>
        <p className="text-xl text-secondary-foreground/80 max-w-md mb-12">
          Equi turns splitting bills into a visual experience. See who's paying for what with intuitive connections and a playful interface.
        </p>
        <div className="flex gap-4">
          <div className="bg-card/10 backdrop-blur-md border border-card/20 p-6 rounded-3xl w-40 text-center">
            <Heart className="w-10 h-10 mx-auto mb-2 text-primary" />
            <div className="font-bold text-lg text-secondary-foreground">Stress Free</div>
          </div>
          <div className="bg-card/10 backdrop-blur-md border border-card/20 p-6 rounded-3xl w-40 text-center">
            <Palette className="w-10 h-10 mx-auto mb-2 text-accent" />
            <div className="font-bold text-lg text-secondary-foreground">Beautiful</div>
          </div>
        </div>
      </motion.div>

      <motion.div initial={{
        opacity: 0,
        x: 20
      }} whileInView={{
        opacity: 1,
        x: 0
      }} transition={{
        duration: 0.5,
        delay: 0.1
      }} viewport={{
        once: true
      }} className="relative h-[600px] w-full backdrop-blur-sm border border-card/10 rounded-[3rem] p-8 flex items-center justify-center overflow-hidden bg-[sidebar-accent-foreground] bg-sidebar-border">
        {/* SVG Arrows connecting avatars to center */}
        <svg className="absolute inset-0 w-full h-full z-10 pointer-events-none">
          <style>
            {`
              .flow-line {
                stroke-dasharray: 8, 8;
                animation: dash 30s linear infinite;
              }
              @keyframes dash {
                to {
                  stroke-dashoffset: -100;
                }
              }
            `}
          </style>
          {/* User 1 (Top Left) PAYS -> Center (Red Arrow) */}
          <line x1="24%" y1="24%" x2="46%" y2="46%" stroke="hsl(var(--brand-terracotta))" strokeWidth="2" className="flow-line" opacity="0.8" />
          <svg x="35%" y="35%" className="overflow-visible">
            <g transform="rotate(45)">
              <polygon points="-5 -3.5, 5 0, -5 3.5" fill="hsl(var(--brand-terracotta))" />
            </g>
          </svg>

          {/* User 3 (Bottom Left) PAYS -> Center (Red Arrow) */}
          <line x1="28%" y1="72%" x2="47%" y2="53%" stroke="hsl(var(--brand-terracotta))" strokeWidth="2" className="flow-line" opacity="0.8" />
          <svg x="37.5%" y="62.5%" className="overflow-visible">
            <g transform="rotate(-45)">
              <polygon points="-5 -3.5, 5 0, -5 3.5" fill="hsl(var(--brand-terracotta))" />
            </g>
          </svg>

          {/* Center PAYS -> User 2 (Bottom Right) (Green Arrow pointing TO User) */}
          <line x1="56%" y1="56%" x2="78%" y2="78%" stroke="hsl(var(--brand-sage))" strokeWidth="2" className="flow-line" opacity="0.8" />
          <svg x="67%" y="67%" className="overflow-visible">
            <g transform="rotate(45)">
              <polygon points="-5 -3.5, 5 0, -5 3.5" fill="hsl(var(--brand-sage))" />
            </g>
          </svg>
        </svg>

        {/* Center icon */}
        <div className="w-32 h-32 bg-background rounded-full flex items-center justify-center shadow-lg relative z-20 text-4xl border-4 border-card/50">
          🍽️
        </div>

        {/* User 1: Top Left - Girl 1 - Pays $42.00 */}
        <div className="absolute top-[15%] left-[15%] animate-float z-20">
          <div className="bg-card p-1 rounded-full shadow-lg relative group transition-transform hover:scale-110">
            <img className="w-16 h-16 rounded-full border-2 border-terracotta" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face" alt="User 1" />
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-card text-foreground px-3 py-1 rounded-lg text-xs font-bold shadow-md opacity-0 group-hover:opacity-100 transition-opacity">
              Anna
            </div>
            <div className="absolute -top-3 -right-3 bg-terracotta text-white text-xs font-bold px-2 py-1 rounded-full shadow-sm w-14 text-center">
              $42.00
            </div>
          </div>
        </div>

        {/* User 2: Bottom Right - Man - Receives $58.00 */}
        <div className="absolute bottom-[20%] right-[15%] animate-float z-20" style={{ animationDelay: "1.5s" }}>
          <div className="bg-card p-1 rounded-full shadow-lg relative group transition-transform hover:scale-110">
            <img className="w-16 h-16 rounded-full border-2 border-sage" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face" alt="User 2" />
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-card text-foreground px-3 py-1 rounded-lg text-xs font-bold shadow-md opacity-0 group-hover:opacity-100 transition-opacity">
              Ben
            </div>
            <div className="absolute -top-3 -right-3 bg-sage text-white text-xs font-bold px-2 py-1 rounded-full shadow-sm w-14 text-center">
              $58.00
            </div>
          </div>
        </div>

        {/* User 3: Bottom Left - Girl 2 - Pays $16.00 */}
        <div className="absolute bottom-[15%] left-[20%] animate-float z-20" style={{ animationDelay: "2.5s" }}>
          <div className="bg-card p-1 rounded-full shadow-lg relative group transition-transform hover:scale-110">
            <img className="w-16 h-16 rounded-full border-2 border-terracotta" src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face" alt="User 3" />
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-card text-foreground px-3 py-1 rounded-lg text-xs font-bold shadow-md opacity-0 group-hover:opacity-100 transition-opacity">
              Chris
            </div>
            <div className="absolute -top-3 -right-3 bg-terracotta text-white text-xs font-bold px-2 py-1 rounded-full shadow-sm w-14 text-center">
              $16.00
            </div>
          </div>
        </div>

        {/* Floating emojis */}
        <span className="absolute top-[30%] right-[25%] text-4xl animate-float" style={{
          animationDelay: "1s"
        }}>
          🌮
        </span>
        <span className="absolute bottom-[40%] left-[10%] text-4xl animate-float" style={{
          animationDelay: "3s"
        }}>
          🍹
        </span>
      </motion.div>
    </div>
  </section>;
};
export default VibeSection;