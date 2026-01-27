import equiLogo from "@/assets/equi-logo.png";

const Footer = () => {
  return (
    <footer className="bg-card py-16 px-4 md:px-8 border-t border-border">
      <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row justify-between items-center md:items-start gap-12">
        <div className="text-center md:text-left">
          <img src={equiLogo} alt="Equi" className="h-12 w-auto mb-6 mx-auto md:mx-0" />
          <p className="text-muted-foreground max-w-xs">
            Making money moments less awkward and more beautiful since 2026.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-12 text-sm font-medium text-muted-foreground">
          <div className="flex flex-col gap-4">
            <span className="text-foreground font-bold">Product</span>
            <a href="#" className="hover:text-primary transition-colors">
              Open App
            </a>
            <a href="#features" className="hover:text-primary transition-colors">
              Features
            </a>
            <a href="#pricing" className="hover:text-primary transition-colors">
              Pricing
            </a>
          </div>

        </div>
      </div>

      <div className="max-w-[1400px] mx-auto mt-16 pt-8 border-t border-border text-center text-muted-foreground text-sm flex flex-col md:flex-row justify-between items-center">
        <p>© 2026 Equi App Inc. All rights reserved.</p>
        <div className="flex gap-4 mt-4 md:mt-0">
          <span className="w-8 h-8 rounded-full bg-muted flex items-center justify-center cursor-pointer hover:bg-secondary hover:text-secondary-foreground transition-all text-xs font-bold">
            IG
          </span>
          <span className="w-8 h-8 rounded-full bg-muted flex items-center justify-center cursor-pointer hover:bg-accent hover:text-accent-foreground transition-all text-xs font-bold">
            TW
          </span>
          <span className="w-8 h-8 rounded-full bg-muted flex items-center justify-center cursor-pointer hover:bg-teal hover:text-teal-foreground transition-all text-xs font-bold">
            LI
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
