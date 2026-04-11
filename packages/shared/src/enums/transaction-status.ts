export enum TransactionStatus {
  COMPRADO = "COMPRADO",
  NAO_PAGO = "NAO_PAGO",
  PAGO = "PAGO",
  CARTAO_OK = "CARTAO_OK",
  USADO = "USADO",
  CANCELADO = "CANCELADO",
}

export const ALLOWED_TRANSITIONS: Record<TransactionStatus, TransactionStatus[]> = {
  [TransactionStatus.COMPRADO]: [TransactionStatus.NAO_PAGO, TransactionStatus.CARTAO_OK, TransactionStatus.PAGO, TransactionStatus.CANCELADO],
  [TransactionStatus.NAO_PAGO]: [TransactionStatus.PAGO, TransactionStatus.CANCELADO],
  [TransactionStatus.CARTAO_OK]: [TransactionStatus.NAO_PAGO, TransactionStatus.PAGO],
  [TransactionStatus.PAGO]: [TransactionStatus.USADO],
  [TransactionStatus.USADO]: [],
  [TransactionStatus.CANCELADO]: [],
};

export const STATUS_LABELS: Record<TransactionStatus, string> = {
  [TransactionStatus.COMPRADO]: "Comprado",
  [TransactionStatus.NAO_PAGO]: "Não Pago",
  [TransactionStatus.PAGO]: "Pago",
  [TransactionStatus.CARTAO_OK]: "Cartão OK",
  [TransactionStatus.USADO]: "Usado",
  [TransactionStatus.CANCELADO]: "Cancelado",
};
