export enum SubscriptionStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  CANCELLED = 'cancelled',
}

export enum UsageEventType {
  WHATSAPP_RESERVATION_CREATED = 'whatsapp_reservation_created',
}

export type BillingPeriodBounds = {
  start: Date;
  end: Date;
};

export type UsageLimitCheckResult =
  | {
      allowed: true;
      reason?: undefined;
    }
  | {
      allowed: false;
      reason: 'missing_active_subscription' | 'inactive_plan' | 'limit_reached';
    };

export type ConsumeWhatsappReservationQuotaParams = {
  accountId: string;
  idempotencyKey: string;
  metadata?: Record<string, unknown>;
};

export type ConsumeWhatsappReservationQuotaResult =
  | {
      allowed: true;
      alreadyConsumed: boolean;
    }
  | {
      allowed: false;
      reason: 'missing_active_subscription' | 'inactive_plan' | 'limit_reached';
    };

export type ReleaseWhatsappReservationQuotaParams = {
  accountId: string;
  idempotencyKey: string;
};

export type ReleaseWhatsappReservationQuotaResult = {
  released: boolean;
};

export type BillingQuotaBlockReason =
  | 'missing_active_subscription'
  | 'inactive_plan'
  | 'limit_reached';

export enum WhatsappReservationQuotaState {
  AVAILABLE = 'available',
  NEAR_LIMIT = 'near_limit',
  EXHAUSTED = 'exhausted',
  UNLIMITED = 'unlimited',
  UNAVAILABLE = 'unavailable',
}

export type WhatsappReservationQuotaUnavailableReason =
  | 'missing_active_subscription'
  | 'inactive_plan'
  | 'invalid_plan_limit';

export type WhatsappReservationQuotaSummaryPlan = {
  id: string;
  code: string;
  name: string;
  monthlyWhatsappReservationLimit: number | null;
};

export type WhatsappReservationQuotaSummary = {
  accountId: string;
  period: string;
  periodStart: string | null;
  periodEnd: string | null;
  plan: WhatsappReservationQuotaSummaryPlan | null;
  used: number;
  remaining: number;
  overage: number;
  state: WhatsappReservationQuotaState;
  unavailableReason?: WhatsappReservationQuotaUnavailableReason;
};

export type BillingUsageConsumeQuotaParams = {
  accountId: string;
  idempotencyKey: string;
  metadata?: Record<string, unknown>;
  occurredAt: Date;
  period: string;
  planLimit: number;
};

export type BillingUsageConsumeQuotaResult =
  | {
      consumed: true;
      alreadyConsumed: boolean;
    }
  | {
      consumed: false;
      reason: 'limit_reached';
    };

export type BillingUsageReleaseQuotaParams = {
  accountId: string;
  idempotencyKey: string;
};

export type BillingUsageReleaseQuotaResult = {
  released: boolean;
};
