import { FaGoogle, FaLinkedin, FaGithub } from 'react-icons/fa';

// ─── Social providers ────────────────────────────────────────────────────────
export const PROVIDERS = [
  { id: 'google', label: 'Google', Icon: FaGoogle, color: 'text-primary' },
  { id: 'github', label: 'GitHub', Icon: FaGithub, color: 'text-primary' },
  { id: 'linkedin', label: 'LinkedIn', Icon: FaLinkedin, color: 'text-primary' },
] as const;