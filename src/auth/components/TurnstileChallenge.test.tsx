import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TurnstileChallenge } from './TurnstileChallenge';

afterEach(() => {
  delete window.turnstile;
  vi.restoreAllMocks();
});

describe('optional Turnstile authentication challenge', () => {
  it('forwards verified tokens, clears expired tokens and removes the widget', async () => {
    let options!: Parameters<NonNullable<typeof window.turnstile>['render']>[1];
    const remove = vi.fn();
    const onTokenChange = vi.fn();
    window.turnstile = {
      render: vi.fn((_container, receivedOptions) => {
        options = receivedOptions;
        return 'widget-1';
      }),
      remove,
    };

    const { unmount } = render(<TurnstileChallenge siteKey="public-test-site-key" onTokenChange={onTokenChange} />);
    await act(async () => undefined);

    expect(window.turnstile.render).toHaveBeenCalledOnce();
    expect(options.sitekey).toBe('public-test-site-key');

    act(() => options.callback('verified-token'));
    expect(onTokenChange).toHaveBeenCalledWith('verified-token');

    act(() => options['expired-callback']());
    expect(onTokenChange).toHaveBeenCalledWith('');

    act(() => options['error-callback']());
    expect(screen.getByRole('alert')).toHaveTextContent('verificação de segurança falhou');

    unmount();
    expect(remove).toHaveBeenCalledWith('widget-1');
  });
});
