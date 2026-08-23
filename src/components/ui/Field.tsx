import { useId, type InputHTMLAttributes } from 'react';

export interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string;
}

export function Field({ label, hint, error, id: suppliedId, className = '', ...props }: FieldProps) {
  const generatedId = useId();
  const id = suppliedId ?? generatedId;
  const descriptionId = hint || error ? `${id}-description` : undefined;
  return (
    <label htmlFor={id} className="block text-sm font-bold">
      {label}
      <input id={id} aria-invalid={!!error} aria-describedby={descriptionId} className={`ui-input mt-2 ${className}`} {...props} />
      {(error || hint) && <span id={descriptionId} className={error ? 'mt-1 block text-sm text-red-600' : 'mt-1 block text-xs text-[var(--core-muted-foreground)]'}>{error ?? hint}</span>}
    </label>
  );
}
