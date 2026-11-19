import { FaGoogle, FaGithub } from 'react-icons/fa';

// ─── Social providers ────────────────────────────────────────────────────────
export const PROVIDERS = [
  { id: 'google', label: 'Google', Icon: FaGoogle, color: 'text-primary' },
  { id: 'github', label: 'GitHub', Icon: FaGithub, color: 'text-primary' },
] as const;