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
