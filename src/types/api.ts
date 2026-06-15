import type { Payment } from "./payment.js";

export interface ApiSuccessResponse<T> {
  success: true;
  data?: T;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  code?: string;
  errors?: unknown;
}

export interface CreatePaymentResult {
  fromCache: boolean;
  payment: Payment;
}

export interface ListPaymentsResponse {
  success: true;
  payments: Payment[];
}

export interface CreatePaymentResponse {
  success: true;
  fromCache: boolean;
  payment: Payment;
}

export interface GetPaymentResponse {
  success: true;
  payment: Payment;
}

export interface UpdatePaymentStatusResponse {
  success: true;
  payment: Payment;
}
