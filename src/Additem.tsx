import { useState, type ReactNode } from 'react';
import { db, toBaseQty, toPaise, UNIT_META, type Unit } from '../db/db';

type View = 'basic' | 'pricing' | 'stock';

interface Form {
  name: string;
  barcode: string;
  unit: Unit;
  salePrice: string;
  purchasePrice: string;
  stock: string;
  stockDate: string; // yyyy-mm-dd
}

type Errors = Partial<Record<'name' | 'barcode' | 'salePrice', string>>;

const NEO =
  'border-[2.5px] border-ink shadow-neo transition-none ' +
  'active:translate-x-1 active:translate-y-1 active:shadow-none';

const VIEWS: { id: View; label: string }[] = [
  { id: 'basic', label: 'Basic' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'stock', label: 'Stock' },
];

const UNITS: { unit: Unit; label: string; hint: string }[] = [
  { unit: 'g', label: 'kg', hint: 'Weight' },
  { unit: 'ml', label: 'L', hint: 'Liquid' },
  { unit: 'pc', label: 'pc', hint: 'Pieces' },
];

const ERROR_VIEW: Record<keyof Errors, View> = {
  name: 'basic',
  barcode: 'basic',
  salePrice: 'pricing',
};

const today = () => new Date().toLocaleDateString('en-CA'); // local yyyy-mm-dd

const EMPTY: Form = {
  name: '',
  barcode: '',
  unit: 'g',
  salePrice: '',
  purchasePrice: '',
  stock: '',
  stockDate: today(),
};

/** Keep digits and a single dot, with at most `max` decimals. */
const cleanDecimal = (v: string, max: number): string => {
  const [whole, ...rest] = v.replace(/[^\d.]/g, '').split('.');
  if (max === 0 || rest.length === 0) return whole;
  return `${whole}.${rest.join('').slice(0, max)}`;
};

function Field({
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
function NeoInput({
  prefix,
  suffix,
  ...props
}: {
  prefix?: string;
  suffix?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
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

export default function AddItem() {
  const [view, setView] = useState<View>('basic');
  const [form, setForm] = useState<Form>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const set = <K extends keyof Form>(key: K, value: Form[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (key in errors) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const unitLabel = UNIT_META[form.unit].display;
  const stockDecimals = form.unit === 'pc' ? 0 : 3;

  const pickUnit = (unit: Unit) =>
    setForm((f) => ({
      ...f,
      unit,
      stock: cleanDecimal(f.stock, unit === 'pc' ? 0 : 3),
    }));

  const flash = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2200);
  };

  const save = async () => {
    if (saving) return;
    const name = form.name.trim();
    const barcode = form.barcode.trim();
    const found: Errors = {};

    if (!name) found.name = 'Enter the item name.';
    else if ((await db.products.where('name').equalsIgnoreCase(name).count()) > 0)
      found.name = 'This item is already added.';

    if (barcode && (await db.products.where('barcode').equals(barcode).count()) > 0)
      found.barcode = 'This barcode is already used.';

    if (!form.salePrice || toPaise(form.salePrice) <= 0)
      found.salePrice = 'Enter a sale price above 0.';

    const firstBad = (Object.keys(found) as (keyof Errors)[]).find((k) => found[k]);
    if (firstBad) {
      setErrors(found);
      setView(ERROR_VIEW[firstBad]);
      return;
    }

    setSaving(true);
    try {
      await db.products.add({
        name,
        barcode: barcode || undefined,
        unit: form.unit,
        stock: toBaseQty(parseFloat(form.stock || '0'), form.unit),
        salePrice: toPaise(form.salePrice),
        purchasePrice: toPaise(form.purchasePrice || '0'),
        stockAsOf: new Date(`${form.stockDate || today()}T00:00:00`).getTime(),
      });
      setForm({ ...EMPTY, stockDate: today() });
      setErrors({});
      setView('basic');
      flash(`Saved: ${name}`);
    } catch {
      flash('Could not save. Tap Save Item again.');
    } finally {
      setSaving(false);
    }
  };

  const viewHasError = (id: View) =>
    (Object.keys(errors) as (keyof Errors)[]).some((k) => errors[k] && ERROR_VIEW[k] === id);

  return (
    <div className="pb-44">
      {/* View toggle */}
      <div role="tablist" className="grid grid-cols-3 gap-3">
        {VIEWS.map((v) => {
          const on = view === v.id;
          return (
            <button
              key={v.id}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setView(v.id)}
              className={`${NEO} flex h-14 items-center justify-center gap-2 font-display text-xl font-extrabold ${
                on ? 'translate-x-1 translate-y-1 bg-go shadow-none' : 'bg-white'
              }`}
            >
              {v.label}
              {viewHasError(v.id) && (
                <span className="flex h-6 w-6 items-center justify-center border-[2.5px] border-ink bg-danger text-sm leading-none">
                  !
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-6 flex flex-col gap-6">
        {view === 'basic' && (
          <>
            <Field label="Item name" error={errors.name}>
              <NeoInput
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="e.g. Toor Dal"
                autoComplete="off"
                enterKeyHint="next"
              />
            </Field>

            <Field label="Barcode (optional)" error={errors.barcode}>
              <NeoInput
                value={form.barcode}
                onChange={(e) => set('barcode', e.target.value.replace(/\s/g, ''))}
                placeholder="Type or scan later"
                inputMode="numeric"
                autoComplete="off"
              />
            </Field>

            <Field label="Sold by">
              <div className="grid grid-cols-3 gap-3">
                {UNITS.map((u) => {
                  const on = form.unit === u.unit;
                  return (
                    <button
                      key={u.unit}
                      type="button"
                      aria-pressed={on}
                      onClick={() => pickUnit(u.unit)}
                      className={`${NEO} flex h-16 flex-col items-center justify-center leading-none ${
                        on ? 'translate-x-1 translate-y-1 bg-go shadow-none' : 'bg-white'
                      }`}
                    >
                      <span className="font-display text-2xl font-extrabold">{u.label}</span>
                      <span className="mt-1 font-body text-sm font-medium">{u.hint}</span>
                    </button>
                  );
                })}
              </div>
            </Field>
          </>
        )}

        {view === 'pricing' && (
          <>
            <Field label={`Sale price per ${unitLabel}`} error={errors.salePrice}>
              <NeoInput
                prefix="₹"
                suffix={`/${unitLabel}`}
                value={form.salePrice}
                onChange={(e) => set('salePrice', cleanDecimal(e.target.value, 2))}
                placeholder="0"
                inputMode="decimal"
              />
            </Field>

            <Field label={`Purchase price per ${unitLabel} (optional)`}>
              <NeoInput
                prefix="₹"
                suffix={`/${unitLabel}`}
                value={form.purchasePrice}
                onChange={(e) => set('purchasePrice', cleanDecimal(e.target.value, 2))}
                placeholder="0"
                inputMode="decimal"
              />
            </Field>
          </>
        )}

        {view === 'stock' && (
          <>
            <Field label="Opening stock">
              <NeoInput
                suffix={unitLabel}
                value={form.stock}
                onChange={(e) => set('stock', cleanDecimal(e.target.value, stockDecimals))}
                placeholder="0"
                inputMode={form.unit === 'pc' ? 'numeric' : 'decimal'}
              />
            </Field>

            <Field label="As of date">
              <NeoInput
                type="date"
                value={form.stockDate}
                onChange={(e) => set('stockDate', e.target.value)}
              />
            </Field>
          </>
        )}
      </div>

      {toast && (
        <div
          role="status"
          className="fixed inset-x-4 bottom-[calc(11rem+env(safe-area-inset-bottom))] z-40 border-[2.5px] border-ink bg-warn px-4 py-3 font-display text-lg font-extrabold shadow-neo"
        >
          {toast}
        </div>
      )}

      {/* Pinned save bar, sits directly above the bottom nav */}
      <div className="fixed inset-x-0 bottom-[calc(5.75rem+env(safe-area-inset-bottom))] z-10 border-t-[2.5px] border-ink bg-cream px-4 py-3">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className={`${NEO} h-16 w-full bg-go font-display text-3xl font-extrabold disabled:bg-white`}
        >
          Save Item
        </button>
      </div>
    </div>
  );
}