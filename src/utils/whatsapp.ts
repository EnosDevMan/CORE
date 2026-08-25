import { Booking, BusinessConfig } from '../types';

/**
 * Monta o link oficial do WhatsApp (https://wa.me/) com uma mensagem já
 * preenchida contendo os dados do agendamento.
 *
 * Importante: isto NÃO é uma integração com a API do WhatsApp. É apenas um
 * link `https://wa.me/<numero>?text=<mensagem>` que abre o aplicativo/web do
 * WhatsApp do próprio cliente com uma conversa já iniciada com o número do
 * estabelecimento e a mensagem pronta. Nenhum serviço de terceiros, automação ou
 * API é utilizado — conforme especificado no escopo do projeto.
 */

/** Normaliza um telefone brasileiro para o formato exigido pelo wa.me (somente dígitos, com DDI 55). */
export function normalizePhoneForWhatsApp(rawPhone: string): string {
  const digits = (rawPhone || '').replace(/\D/g, '');
  if (!digits) return '';
  // Se já vier com o DDI do Brasil (55) e tamanho compatível, mantém.
  if (digits.startsWith('55') && digits.length >= 12) return digits;
  return `55${digits}`;
}

/**
 * Primitiva genérica de link wa.me: normaliza o telefone e monta a URL já
 * com a mensagem codificada. Vários lugares do app (confirmação de
 * reserva, contato do profissional com o cliente) precisam disso, então fica
 * centralizado aqui em vez de cada tela reimplementar sua própria limpeza
 * de dígitos do telefone.
 */
export function buildWhatsAppLink(phone: string, message: string): string | null {
  const digits = normalizePhoneForWhatsApp(phone);
  if (!digits) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

function formatDateBR(date: string): string {
  const [y, m, d] = date.split('-');
  return `${d}/${m}/${y}`;
}

export function buildBookingWhatsAppLink(params: {
  booking: Booking;
  config: BusinessConfig;
  professionalName?: string;
  serviceNames?: string;
}): string | null {
  const { booking, config, professionalName, serviceNames } = params;

  const phone = normalizePhoneForWhatsApp(config.phone || '');
  if (!phone) return null;

  const lines = [
    `Olá! Gostaria de confirmar meu agendamento em *${config.name || 'nosso estabelecimento'}*:`,
    ``,
    `📅 Data: ${formatDateBR(booking.date)}`,
    `⏰ Horário: ${booking.time}`,
  ];

  if (professionalName) lines.push(`Profissional: ${professionalName}`);
  if (serviceNames) lines.push(`Serviço(s): ${serviceNames}`);

  lines.push(``, `Nome: ${booking.customerName}`);

  const message = lines.join('\n');
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
