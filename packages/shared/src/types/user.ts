import { UserRole } from "../enums/roles";

export interface User {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  phone?: string;
  pixKey?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  displayName: string;
  role: UserRole;
  phone?: string;
  pixKey?: string;
}

export interface UpdateUserRequest {
  displayName?: string;
  role?: UserRole;
  phone?: string;
  pixKey?: string;
  active?: boolean;
}
