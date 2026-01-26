import { motion } from "framer-motion";
import SmartSettlementSection from "./SmartSettlementSection";

const FeaturesSection = () => {
  return (
    <section className="py-24 px-4 md:px-8 max-w-[1400px] mx-auto" id="features">
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
                  <span>ITEM 001</span>
                  <span>$12.99</span>
                </div>
                <div className="flex justify-between">
                  <span>ITEM 002</span>
                  <span>$24.50</span>
                </div>
                <div className="flex justify-between">
                  <span>ITEM 003</span>
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
              Instantly itemized, categorized, and ready to assign. Drag, drop, done.
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
    </section>
  );
};

export default FeaturesSection;
