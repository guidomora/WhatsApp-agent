export const DEFAULT_ACCOUNT_ID = 'default';
const WHATSAPP_QUOTA_BLOCKED_REPLY_PREFIX =
  'No puedo confirmar nuevas reservas por WhatsApp en este momento.';
export const WHATSAPP_QUOTA_BLOCKED_REPLY = `${WHATSAPP_QUOTA_BLOCKED_REPLY_PREFIX} Escribinos por contacto directo y te ayudamos manualmente.`;

export function getWhatsappQuotaBlockedReply(): string {
  const contactNumber = process.env.LARGE_RESERVATION_CONTACT_NUMBER?.trim();

  if (!contactNumber) {
    return WHATSAPP_QUOTA_BLOCKED_REPLY;
  }

  return `${WHATSAPP_QUOTA_BLOCKED_REPLY_PREFIX} Comunicate al ${contactNumber} y te ayudamos manualmente.`;
}
