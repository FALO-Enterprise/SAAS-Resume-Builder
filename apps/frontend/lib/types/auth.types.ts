// Register form state and error types
export type RegisterData = {
  name: string;
  email: string;
  password: string;
  confirm: string;
  avatar?: string;
}

export type FormErrors = {
  name?: string;
  email?: string;
  password?: string;
  confirm?: string;
}

// Login form state and error types

export type LoginData = {
  email: string;
  password: string;
}

export type FieldError = {
  email?: string;
  password?: string;
  general?: string;
}

// Auth user type
export type PlanName = 'FREE' | 'PRO' | 'ENTERPRISE';

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: string;
  planName: PlanName;
}

// Auth context type
export type AuthContextType = {
  isOpen: boolean;
  isVerified: boolean;
  user: AuthUser | null;
  openLogin: () => void;
  closeModal: () => void;
  login: (user: AuthUser) => void;
  logout: () => void;
  updateUser: (user: AuthUser) => void;
}




export type SessionUser = {
  id: string
  name: string
  email: string
  role: string
}