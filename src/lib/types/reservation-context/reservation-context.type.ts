export type UpsertReservationContextInput = {
  waId: string;
  phone: string;
  reservationDate: string;
  reservationTime: string;
  reservationStartsAt: Date;
  reservationEndsAt: Date;
  name: string;
  quantity: number;
  lastConversationSummary?: string | null;
};

export type MarkReservationContextsResult = {
  affected: number;
};

export type ReservationContextResult = {
  id: string;
  waId: string;
  phone: string;
  reservationDate: string;
  reservationTime: string;
  reservationStartsAt: Date;
  reservationEndsAt: Date;
  name: string;
  quantity: number;
  lastConversationSummary?: string | null;
  createdAt: Date;
  updatedAt: Date;
};
