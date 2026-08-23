export type NotificationChannel = 'whatsapp' | 'email' | 'sms' | 'push' | 'automation';

export interface NotificationEvent<TPayload = unknown> {
  type: 'booking.created' | 'booking.rescheduled' | 'booking.cancelled';
  payload: TPayload;
  requestedChannels?: NotificationChannel[];
}

export interface NotificationProvider {
  supports(channel: NotificationChannel): boolean;
  send(event: NotificationEvent): Promise<void>;
}

export interface NotificationDeliveryResult {
  status: 'not_configured' | 'delivered' | 'partially_delivered' | 'failed';
  attemptedProviders: number;
  failedProviders: number;
}

/**
 * Provider-agnostic notification boundary. No external provider is registered
 * yet; future n8n, WhatsApp, e-mail, SMS and push adapters plug in here rather
 * than leaking integration details into booking screens.
 */
class NotificationService {
  private providers = new Set<NotificationProvider>();

  register(provider: NotificationProvider) {
    this.providers.add(provider);
    return () => this.providers.delete(provider);
  }

  async publish(event: NotificationEvent): Promise<NotificationDeliveryResult> {
    const channels = event.requestedChannels ?? [];
    const applicable = [...this.providers].filter(provider => channels.length === 0 || channels.some(channel => provider.supports(channel)));

    if (applicable.length === 0) {
      console.warn('[CORE] Notificação sem provedor configurado:', event.type);
      return { status: 'not_configured', attemptedProviders: 0, failedProviders: 0 };
    }

    const results = await Promise.allSettled(applicable.map(provider => provider.send(event)));
    const failedProviders = results.filter(result => result.status === 'rejected').length;

    if (failedProviders > 0) {
      console.error('[CORE] Falha no envio de notificação:', event.type, failedProviders);
    }

    return {
      status: failedProviders === 0
        ? 'delivered'
        : failedProviders === applicable.length
          ? 'failed'
          : 'partially_delivered',
      attemptedProviders: applicable.length,
      failedProviders,
    };
  }
}

export const notificationService = new NotificationService();
