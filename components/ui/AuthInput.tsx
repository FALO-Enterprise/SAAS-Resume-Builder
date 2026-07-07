import { motion } from 'framer-motion';

export default function AuthInput({ icon: Icon, type, placeholder, value, onChange, error, rightSlot, label }: {
  icon: React.ElementType; type: string; placeholder: string;
  value: string; onChange: (v: string) => void;
  error?: string; rightSlot?: React.ReactNode; label?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-[13px] font-medium text-faint">{label}</label>}
      <div
        className={`group flex items-center rounded-xl bg-card px-4 transition-all focus-within:bg-card-hover ${error
            ? 'border border-pink-light/50'
            : 'border border-edge focus-within:border-gold/50 focus-within:shadow-[0_0_0_3px_rgba(245,166,35,0.08)]'
          }`}
      >
        <Icon size={16} className="shrink-0 text-faint transition-colors group-focus-within:text-gold" />
        <input
          type={type} placeholder={placeholder} value={value}
          onChange={e => onChange(e.target.value)}
          className="flex-1 border-none bg-transparent px-3 py-3.5 text-sm text-primary outline-none"
        />
        {rightSlot}
      </div>
      {error && (
        <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
          className="pl-1 text-xs text-pink-light">
          {error}
        </motion.p>
      )}
    </div>
  );
}