// Register form state and error types
export type RegisterData = {
  name: string;
  email: string;
  password: string;
  confirm: string;
}

export type FormErrors = {
  name?: string;
  email?: string;
  password?: string;
  confirm?: string;
}

// Login form state and error types

export type FormState = {
  email: string;
  password: string;
}

export type FieldError = {
  email?: string;
  password?: string;
  general?: string;
}


