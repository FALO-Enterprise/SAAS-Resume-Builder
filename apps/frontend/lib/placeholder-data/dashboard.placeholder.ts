
import { User, Briefcase, GraduationCap, Zap } from 'lucide-react';
import type { StepId } from '@/lib/types/dashboard.types';

export const STEPS: {
  id: StepId;
  label: string;
  icon: React.ElementType;
  num: number;
  desc: string;
}[] = [
  { id: 'contact',    label: 'Contact',    icon: User,          num: 1, desc: 'Personal & contact info'   },
  { id: 'experience', label: 'Experience', icon: Briefcase,     num: 2, desc: 'Work history & roles'      },
  { id: 'education',  label: 'Education',  icon: GraduationCap, num: 3, desc: 'Degrees & certifications'  },
  { id: 'skills',     label: 'Skills',     icon: Zap,           num: 4, desc: 'Technical & soft skills'   },
];

export const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
export const YEARS = Array.from({ length: 40 }, (_, i) => String(new Date().getFullYear() - i));

export const DEFAULT_SUGGESTIONS = [
  'AWS Cloud', 'UI/UX Design', 'Agile Method', 'Data Analysis',
  'Product Strategy', 'TypeScript', 'Docker', 'GraphQL',
  'Kubernetes', 'Figma', 'Python', 'System Design',
];

