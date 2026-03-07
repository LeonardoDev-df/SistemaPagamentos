export function calculateFee(cardBalance: number, feePercentage: number) {
  const feeAmount = Math.round(cardBalance * (feePercentage / 100) * 100) / 100;
  const netAmount = Math.round((cardBalance - feeAmount) * 100) / 100;
  return { feeAmount, netAmount };
}
