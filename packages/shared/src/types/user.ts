import { UserRole } from "../enums/roles";

export interface Address {
  rua: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
}

export interface User {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  phone?: string;
  pixKey?: string;
  cpf?: string;
  address?: Address;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRequest {
  email: string;
  password?: string;
  displayName: string;
  role: UserRole;
  phone?: string;
  pixKey?: string;
  cpf?: string;
  address?: Address;
}

export interface UpdateUserRequest {
  displayName?: string;
  role?: UserRole;
  phone?: string;
  pixKey?: string;
  cpf?: string;
  address?: Address;
  active?: boolean;
}
