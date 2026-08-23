import { afterEach, describe, expect, it, vi } from 'vitest';
import { notificationService, type NotificationProvider } from './notificationService';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('notification delivery boundary', () => {
  it('reports an unconfigured provider without exposing the event payload', async () => {
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const payload = { customerPhone: '85999999999' };

    await expect(notificationService.publish({
      type: 'booking.created',
      payload,
      requestedChannels: ['whatsapp'],
    })).resolves.toEqual({
      status: 'not_configured',
      attemptedProviders: 0,
      failedProviders: 0,
    });

    expect(warning).toHaveBeenCalledWith('[CORE] Notificação sem provedor configurado:', 'booking.created');
    expect(JSON.stringify(warning.mock.calls)).not.toContain(payload.customerPhone);
  });

  it('reports successful delivery only for providers supporting the requested channel', async () => {
    const whatsapp: NotificationProvider = {
      supports: channel => channel === 'whatsapp',
      send: vi.fn().mockResolvedValue(undefined),
    };
    const email: NotificationProvider = {
      supports: channel => channel === 'email',
      send: vi.fn().mockResolvedValue(undefined),
    };
    const unregisterWhatsapp = notificationService.register(whatsapp);
    const unregisterEmail = notificationService.register(email);

    try {
      await expect(notificationService.publish({
        type: 'booking.cancelled',
        payload: {},
        requestedChannels: ['whatsapp'],
      })).resolves.toEqual({
        status: 'delivered',
        attemptedProviders: 1,
        failedProviders: 0,
      });

      expect(whatsapp.send).toHaveBeenCalledOnce();
      expect(email.send).not.toHaveBeenCalled();
    } finally {
      unregisterWhatsapp();
      unregisterEmail();
    }
  });

  it('makes partial delivery failures observable without exposing customer data', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const delivered: NotificationProvider = {
      supports: () => true,
      send: vi.fn().mockResolvedValue(undefined),
    };
    const failed: NotificationProvider = {
      supports: () => true,
      send: vi.fn().mockRejectedValue(new Error('sensitive-provider-response')),
    };
    const unregisterDelivered = notificationService.register(delivered);
    const unregisterFailed = notificationService.register(failed);

    try {
      await expect(notificationService.publish({
        type: 'booking.rescheduled',
        payload: { customerName: 'Informação privada' },
      })).resolves.toEqual({
        status: 'partially_delivered',
        attemptedProviders: 2,
        failedProviders: 1,
      });

      expect(error).toHaveBeenCalledWith('[CORE] Falha no envio de notificação:', 'booking.rescheduled', 1);
      expect(JSON.stringify(error.mock.calls)).not.toContain('Informação privada');
    } finally {
      unregisterDelivered();
      unregisterFailed();
    }
  });
});
