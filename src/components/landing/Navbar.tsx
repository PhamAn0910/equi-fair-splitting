import { motion } from "framer-motion";
import equiLogo from "@/assets/equi-logo.png";

const Navbar = () => {
  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 p-4 md:p-6 flex justify-center"
    >
      <div className="bg-card/70 backdrop-blur-md border border-border p-2 pl-4 pr-2 rounded-full flex items-center shadow-sm">
        <a href="#" className="mr-6 md:mr-8">
          <img src={equiLogo} alt="Equi" className="h-8 md:h-10 w-auto" />
        </a>
        <div className="hidden md:flex items-center gap-1">
          <a
            href="#features"
            className="px-5 py-2 text-sm font-medium rounded-full hover:bg-foreground/5 transition-colors"
          >
            Features
          </a>
          <a
            href="#vibe"
            className="px-5 py-2 text-sm font-medium rounded-full hover:bg-foreground/5 transition-colors"
          >
            The Vibe
          </a>
          <a
            href="#pricing"
            className="px-5 py-2 text-sm font-medium rounded-full hover:bg-foreground/5 transition-colors"
          >
            Pricing
          </a>
        </div>
        <a
          href="/app"
          className="ml-2 bg-foreground text-background px-6 py-2.5 rounded-full text-sm font-medium hover:scale-105 transition-transform"
        >
          Open App
        </a>
      </div>
    </motion.nav>
  );
};

export default Navbar;
