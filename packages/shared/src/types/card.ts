export interface Card {
  id: string;
  vendedorId: string;
  vendedorName: string;
  cardType: "VR" | "VA";
  cardBrand: string;
  cardPassword?: string; // encrypted, only returned to comprador/admin
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCardRequest {
  vendedorId: string;
  cardType: "VR" | "VA";
  cardBrand: string;
  cardPassword: string;
}

export interface UpdateCardRequest {
  cardBrand?: string;
  cardPassword?: string;
  active?: boolean;
}
