import { motion } from "framer-motion";
import SmartSettlementSection from "./SmartSettlementSection";
import { Check, Palette, Ban } from "lucide-react";

const FeaturesSection = () => {
  return (
    <div id="features">
      <div className="pt-24 pb-16 px-4 md:px-8 max-w-[1400px] mx-auto">
        <div className="flex flex-col md:flex-row gap-8 min-h-[500px] md:min-h-[700px]">
          {/* Scan the chaos card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="w-full md:w-1/2 bg-card rounded-[2.5rem] p-8 md:p-12 flex flex-col relative overflow-hidden shadow-lg group hover:shadow-2xl transition-all duration-500 min-h-[400px] md:min-h-0"
          >
            <div className="relative z-10">
              <h3 className="text-3xl md:text-4xl font-display font-semibold mb-4">Scan the chaos.</h3>
              <p className="text-base md:text-lg text-muted-foreground">
                Simply snap a photo of any receipt. Our AI reads the messy details so you don't have to type manually.
              </p>
            </div>

            <div className="absolute bottom-0 left-0 w-full h-[50%] md:h-[60%] flex items-end justify-center">
              <div className="w-[60%] md:w-[70%] h-[100%] md:h-[120%] bg-muted rotate-[-5deg] translate-y-16 md:translate-y-20 shadow-xl p-4 md:p-6 relative rounded-t-lg transition-transform duration-500 group-hover:translate-y-10 group-hover:rotate-0">
                <div className="w-full h-4 bg-border mb-4 rounded opacity-50" />
                <div className="w-[80%] h-3 bg-border mb-2 rounded opacity-30" />
                <div className="w-[60%] h-3 bg-border mb-2 rounded opacity-30" />
                <div className="w-[90%] h-3 bg-border mb-8 rounded opacity-30" />
                <div className="space-y-3 font-mono text-xs text-muted-foreground opacity-60">
                  <div className="flex justify-between">
                    <span>TRUFFLE FRIES</span>
                    <span>$12.99</span>
                  </div>
                  <div className="flex justify-between">
                    <span>WAGYU SLIDERS</span>
                    <span>$24.50</span>
                  </div>
                  <div className="flex justify-between">
                    <span>SPARKLING H2O</span>
                    <span>$8.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span>TAX</span>
                    <span>$4.55</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Get the clarity card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
            className="w-full md:w-1/2 bg-secondary rounded-[2.5rem] p-8 md:p-12 flex flex-col relative overflow-hidden shadow-lg text-secondary-foreground min-h-[450px] md:min-h-0"
          >
            <div className="relative z-10 mb-4">
              <h3 className="text-3xl md:text-4xl font-display font-semibold mb-4">Get the clarity.</h3>
              <p className="text-base md:text-lg text-secondary-foreground/80">
                Instantly itemized, categorized, and ready to assign. Tap to split.
              </p>
            </div>

            <div className="relative md:absolute md:bottom-0 md:right-0 w-full h-[280px] md:h-[70%] mt-auto">
              <div className="relative w-full h-full flex items-start md:items-center justify-center pt-4 md:pt-0">
                {/* Burger card */}
                <div className="absolute top-0 md:top-10 left-[5%] md:left-[15%] w-56 md:w-64 bg-card text-foreground p-3 md:p-4 rounded-2xl shadow-xl transform -rotate-3 md:-rotate-6 z-10 animate-float">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-lg">
                      🍔
                    </span>
                    <span className="font-bold">Burger & Fries</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex -space-x-2">
                      <img
                        alt="u1"
                        className="w-6 h-6 rounded-full border border-card"
                        src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=50&h=50&fit=crop&crop=face"
                      />
                      <img
                        alt="u2"
                        className="w-6 h-6 rounded-full border border-card"
                        src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop&crop=face"
                      />
                    </div>
                    <span className="font-bold">$18.50</span>
                  </div>
                </div>

                {/* Cocktails card */}
                <div
                  className="absolute top-28 md:top-32 right-[5%] md:right-[15%] w-56 md:w-64 bg-card text-foreground p-3 md:p-4 rounded-2xl shadow-xl transform rotate-2 md:rotate-3 z-20 animate-float"
                  style={{ animationDelay: "1.5s" }}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="w-8 h-8 rounded-full bg-teal/20 flex items-center justify-center text-teal text-lg">
                      🍸
                    </span>
                    <span className="font-bold">Craft Cocktails</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex -space-x-2">
                      <img
                        alt="u3"
                        className="w-6 h-6 rounded-full border border-card"
                        src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=50&h=50&fit=crop&crop=face"
                      />
                    </div>
                    <span className="font-bold">$32.00</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="mt-24">
          <SmartSettlementSection />
        </div>


        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="mt-16 mb-12 max-w-[1400px] mx-auto bg-card rounded-[2.5rem] p-6 md:p-10 border border-border/50 shadow-lg overflow-hidden relative"
        >
          <div className="relative z-10 flex flex-col lg:flex-row items-center gap-16">
            <div className="lg:w-1/2 flex justify-center w-full">
              <div className="relative w-full max-w-[320px] bg-background text-foreground rounded-[2.5rem] p-8 shadow-2xl border border-border/50">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <img
                      alt="Manager"
                      className="w-12 h-12 rounded-full border-2 border-primary"
                      src="https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=64&h=64&fit=crop&crop=face"
                    />
                    <div className="font-bold text-lg">You (Manager)</div>
                  </div>
                  <Check className="text-primary w-6 h-6" strokeWidth={3} />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-2xl">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-sm">
                        G1
                      </div>
                      <span className="font-semibold text-muted-foreground">Guest 1</span>
                    </div>
                    <span className="font-black text-foreground">$24.50</span>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-2xl">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-400 flex items-center justify-center font-bold text-sm">
                        G2
                      </div>
                      <span className="font-semibold text-muted-foreground">Guest 2</span>
                    </div>
                    <span className="font-black text-foreground">$12.00</span>
                  </div>
                </div>

                <div className="mt-8">
                  <button className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-bold text-sm shadow-lg hover:brightness-105 transition-all">
                    Split & Share Result
                  </button>
                </div>
              </div>
            </div>

            <div className="lg:w-1/2 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted rounded-full text-xs font-bold mb-6 border border-border text-muted-foreground">
                <Ban className="w-4 h-4" />
                <span className="tracking-wide">Frictionless Splitting</span>
              </div>

              <h2 className="text-4xl md:text-5xl font-display font-medium mb-6 leading-[1.1] text-foreground">
                No account? <br />
                No problem.
              </h2>

              <p className="text-lg md:text-xl font-semibold mb-6 opacity-90 text-foreground">
                One person manages, everyone stays sorted.
              </p>

              <p className="text-base text-muted-foreground leading-relaxed max-w-lg mx-auto lg:mx-0">
                Skip the friction of forcing friends to sign up, create accounts, or join groups. Just split and share the
                result.
              </p>
            </div>

            <div className="absolute bottom-10 right-10 opacity-5 pointer-events-none">
              <Palette className="w-32 h-32 text-foreground" />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default FeaturesSection;
