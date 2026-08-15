
import { AlignLeft, Briefcase, FolderKanban, GraduationCap, User, Zap } from 'lucide-react';
import type { StepId } from '@/lib/types/dashboard.types';

export const STEPS: {
  id: StepId;
  label: string;
  icon: React.ElementType;
  num: number;
  desc: string;
}[] = [
    { id: 'contact', label: 'Contact', icon: User, num: 1, desc: 'Personal details & links' },
    { id: 'summary', label: 'Summary', icon: AlignLeft, num: 2, desc: 'Professional introduction' },
    { id: 'skills', label: 'Skills', icon: Zap, num: 3, desc: 'Detailed skill categories' },
    { id: 'experience', label: 'Experience', icon: Briefcase, num: 4, desc: 'Work history & roles' },
    { id: 'projects', label: 'Projects', icon: FolderKanban, num: 5, desc: 'Projects & technologies' },
    { id: 'education', label: 'Education', icon: GraduationCap, num: 6, desc: 'Degrees & certifications' },
  ];

export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const YEARS = Array.from({ length: 40 }, (_, i) => String(new Date().getFullYear() - i));

export const DEFAULT_SUGGESTIONS = [
  'AWS Cloud', 'UI/UX Design', 'Agile Method', 'Data Analysis',
  'Product Strategy', 'TypeScript', 'Docker', 'GraphQL',
  'Kubernetes', 'Figma', 'Python', 'System Design',
];

