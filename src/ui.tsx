import type { InputHTMLAttributes, ReactNode } from 'react';

export const NEO =
  'border-[2.5px] border-ink shadow-neo transition-none ' +
  'active:translate-x-1 active:translate-y-1 active:shadow-none';

/** Keep digits and a single dot, with at most `max` decimals. */
export const cleanDecimal = (v: string, max: number): string => {
  const [whole, ...rest] = v.replace(/[^\d.]/g, '').split('.');
  if (max === 0 || rest.length === 0) return whole;
  return `${whole}.${rest.join('').slice(0, max)}`;
};

export function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block font-body text-lg font-medium">{label}</label>
      {children}
      {error && (
        <p
          role="alert"
          className="mt-2 border-[2.5px] border-ink bg-danger px-3 py-1 font-display text-base font-extrabold"
        >
          {error}
        </p>
      )}
    </div>
  );
}

/** Input box that sits flat with a hard shadow and "presses in" while focused. */
export function NeoInput({
  prefix,
  suffix,
  ...props
}: {
  prefix?: string;
  suffix?: string;
} & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="flex h-14 items-center border-[2.5px] border-ink bg-white shadow-neo transition-none focus-within:translate-x-1 focus-within:translate-y-1 focus-within:bg-warn focus-within:shadow-none">
      {prefix && <span className="pl-3 font-display text-xl font-extrabold">{prefix}</span>}
      <input
        {...props}
        className="h-full min-w-0 flex-1 bg-transparent px-3 font-body text-xl font-medium outline-none placeholder:text-ink/40"
      />
      {suffix && <span className="pr-3 font-display text-xl font-extrabold">{suffix}</span>}
    </div>
  );
}