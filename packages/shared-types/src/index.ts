// Export all shared type definitions
// This file will barrel-export DTOs used by both frontend and backend

// Example: Auth DTOs
export interface LoginDTO {
  email: string;
  password: string;
}

export interface SignupDTO extends LoginDTO {
  name: string;
  confirmPassword: string;
}

export interface AuthResponseDTO {
  id: string;
  email: string;
  name: string;
  token: string;
}

// Example: Resume DTOs
export interface ResumeDTO {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateResumeDTO {
  title: string;
  content: string;
}

export interface UpdateResumeDTO {
  title?: string;
  content?: string;
}

// Example: Template DTOs
export interface TemplateDTO {
  id: string;
  name: string;
  description: string;
}

// Add more DTOs as needed
