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

  async publish(event: NotificationEvent): Promise<void> {
    const channels = event.requestedChannels ?? [];
    const applicable = [...this.providers].filter(provider => channels.length === 0 || channels.some(channel => provider.supports(channel)));
    await Promise.allSettled(applicable.map(provider => provider.send(event)));
  }
}

export const notificationService = new NotificationService();
