let counter = 1;

export function generatePaymentId() {
  return `pay_${counter++}`;
}
