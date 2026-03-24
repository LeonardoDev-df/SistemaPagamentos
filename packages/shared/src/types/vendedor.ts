import { Address } from "./user";

export interface Vendedor {
  id: string;
  compradorId: string;
  nome: string;
  funcao?: string;
  empresa?: string;
  phone?: string;
  pixKey?: string;
  cpf?: string;
  address?: Address;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVendedorRequest {
  nome: string;
  funcao?: string;
  empresa?: string;
  phone?: string;
  pixKey?: string;
  cpf?: string;
  address?: Address;
}

export interface UpdateVendedorRequest {
  nome?: string;
  funcao?: string;
  empresa?: string;
  phone?: string;
  pixKey?: string;
  cpf?: string;
  address?: Address;
  active?: boolean;
}
