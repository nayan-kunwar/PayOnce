export const PAYMENT_STATUSES = [
  "pending",
  "completed",
  "failed",
  "cancelled",
] as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export interface Payment {
  id: string;
  amount: number;
  customerId: string;
  status: PaymentStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePaymentDTO {
  amount: number;
  customerId: string;
}

export interface UpdatePaymentStatusDTO {
  status: PaymentStatus;
}

export const ALLOWED_STATUS_TRANSITIONS: Record<
  PaymentStatus,
  readonly PaymentStatus[]
> = {
  pending: ["completed", "failed", "cancelled"],
  completed: [],
  failed: [],
  cancelled: [],
};
