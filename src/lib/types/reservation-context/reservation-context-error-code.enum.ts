export enum ReservationContextErrorCode {
  REQUIRED_FIELD_MISSING = 'required_field_missing',
  INVALID_QUANTITY = 'invalid_quantity',
  INVALID_TIME_WINDOW = 'invalid_time_window',
  INVALID_CUTOFF_DATE = 'invalid_cutoff_date',
  SUMMARY_TOO_LONG = 'summary_too_long',
  SUMMARY_LOOKS_LIKE_TRANSCRIPT = 'summary_looks_like_transcript',
  PERSISTENCE_ERROR = 'persistence_error',
}
