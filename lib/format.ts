export function formatPrice(amount: number): string {
  const rounded = Math.round(amount);
  const display = Number.isInteger(amount) ? rounded : amount.toFixed(2);
  return `${display} جنيه`;
}

export function formatEgp(amount: number): string {
  const rounded = Math.round(amount);
  const display = Number.isInteger(amount) ? rounded : amount.toFixed(2);
  return `${display} EGP`;
}
