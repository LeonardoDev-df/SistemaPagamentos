export interface Card {
  id: string;
  vendedorId: string;
  vendedorName: string;
  cardType: "VR" | "VA";
  cardBrand: string;
  cardNumber?: string;
  cardPassword?: string; // encrypted, only returned to comprador/admin
  valorMensal?: number; // valor mensal do crédito
  diaVencimento?: number; // dia do mês que cai o crédito
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCardRequest {
  vendedorId: string;
  cardType: "VR" | "VA";
  cardBrand: string;
  cardNumber?: string;
  cardPassword: string;
  valorMensal?: number;
  diaVencimento?: number;
}

export interface UpdateCardRequest {
  cardBrand?: string;
  cardNumber?: string;
  cardPassword?: string;
  valorMensal?: number;
  diaVencimento?: number;
  active?: boolean;
}
