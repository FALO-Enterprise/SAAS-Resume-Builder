const Logo = () => (
  <div className="flex items-center gap-2.5">
    <div className="relative w-8 h-8">
      <div className="absolute inset-0 bg-linear-to-br from-gold to-gold-dark rounded-lg rotate-3" />
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-white font-black text-sm font-playfair">R</span>
      </div>
    </div>
    <span
      className="text-primary font-bold text-xl tracking-tight"
    >
      Resu<span className="text-gold">Max</span>
    </span>
  </div>
);

export default Logo;