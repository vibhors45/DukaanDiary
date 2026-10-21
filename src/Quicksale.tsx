import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  db,
  calcTotal,
  formatQty,
  formatRupees,
  toBaseQty,
  UNIT_META,
  type Product,
} from '../db/db';

const NEO =
  'border-[2.5px] border-ink shadow-neo transition-none ' +
  'active:translate-x-1 active:translate-y-1 active:shadow-none';

/** Chip values are in display units (kg / L / pc). Half only makes sense for kg and L. */
const CHIPS = [
  { label: '1', value: 1 },
  { label: '2', value: 2 },
  { label: '5', value: 5 },
  { label: '½', value: 0.5 },
];

export default function QuickSale({ onAddItem }: { onAddItem?: () => void }) {
  const products = useLiveQuery(() => db.products.orderBy('name').toArray(), []);
  const [selected, setSelected] = useState<Product | null>(null);
  const [chip, setChip] = useState(1);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const openSheet = (p: Product) => {
    setSelected(p);
    setChip(1);
  };
  const closeSheet = () => setSelected(null);

  const qty = selected ? toBaseQty(chip, selected.unit) : 0;
  const total = selected ? calcTotal(qty, selected.salePrice, selected.unit) : 0;
  const overStock = selected ? qty > selected.stock : false;

  const saveSale = async () => {
    if (!selected?.id || saving) return;
    setSaving(true);
    const { id, name } = selected;
    try {
      // One atomic transaction: the sale row and the stock decrement succeed or fail together.
      await db.transaction('rw', db.sales, db.products, async () => {
        await db.sales.add({ productId: id, qty, total, date: Date.now() });
        await db.products
          .where('id')
          .equals(id)
          .modify((p) => {
            p.stock = Math.max(0, p.stock - qty);
          });
      });
      setToast(`Saved: ${formatQty(qty, selected.unit)} ${name} · ${formatRupees(total)}`);
      window.setTimeout(() => setToast(null), 2200);
      closeSheet();
    } catch {
      setToast('Could not save. Tap Save Sale again.');
      window.setTimeout(() => setToast(null), 2500);
    } finally {
      setSaving(false);
    }
  };

  if (products === undefined) return null;

  if (products.length === 0) {
    return (
      <section className="border-[2.5px] border-ink bg-white p-5 shadow-neo">
        <h2 className="font-display text-3xl font-extrabold leading-tight">No items yet</h2>
        <p className="mt-2 text-lg">Add your first item to start logging sales.</p>
        {onAddItem && (
          <button
            type="button"
            onClick={onAddItem}
            className={`${NEO} mt-4 h-16 w-full bg-go font-display text-2xl font-extrabold`}
          >
            Add Item
          </button>
        )}
      </section>
    );
  }

  return (
    <>
      <ul className="grid grid-cols-2 gap-4">
        {products.map((p) => {
          const out = p.stock <= 0;
          return (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => openSheet(p)}
                className={`${NEO} flex min-h-28 w-full flex-col items-start justify-between gap-2 p-3 text-left ${
                  out ? 'bg-danger' : 'bg-white'
                }`}
              >
                <span className="font-display text-2xl font-extrabold leading-tight">
                  {p.name}
                </span>
                <span className="text-base">
                  <span className="font-display text-lg font-extrabold">
                    {formatRupees(p.salePrice)}
                  </span>
                  /{UNIT_META[p.unit].display}
                  <br />
                  {out ? 'Out of stock' : `${formatQty(p.stock, p.unit)} left`}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {toast && (
        <div
          role="status"
          className="fixed inset-x-4 bottom-28 z-40 border-[2.5px] border-ink bg-warn px-4 py-3 font-display text-lg font-extrabold shadow-neo"
        >
          {toast}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-30 flex flex-col justify-end" role="dialog" aria-modal="true">
          {/* Flat dim layer: tap to dismiss */}
          <button
            type="button"
            aria-label="Close"
            onClick={closeSheet}
            className="flex-1 cursor-default bg-ink/60"
          />

          <div className="border-t-[2.5px] border-ink bg-cream px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-3xl font-extrabold leading-tight">
                  {selected.name}
                </h2>
                <p className="text-base">
                  {formatRupees(selected.salePrice)}/{UNIT_META[selected.unit].display} ·{' '}
                  {formatQty(selected.stock, selected.unit)} in stock
                </p>
              </div>
              <button
                type="button"
                onClick={closeSheet}
                aria-label="Close"
                className={`${NEO} flex h-12 w-12 shrink-0 items-center justify-center bg-white`}
              >
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="square" aria-hidden="true">
                  <path d="M5 5l14 14M19 5L5 19" />
                </svg>
              </button>
            </div>

            <div className="mt-4 grid grid-cols-4 gap-3">
              {CHIPS.filter((c) => c.value >= 1 || UNIT_META[selected.unit].factor > 1).map((c) => {
                const on = chip === c.value;
                return (
                  <button
                    key={c.label}
                    type="button"
                    onClick={() => setChip(c.value)}
                    aria-pressed={on}
                    className={`${NEO} h-16 font-display text-3xl font-extrabold ${
                      on ? 'translate-x-1 translate-y-1 bg-go shadow-none' : 'bg-white'
                    }`}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>

            <p className="mt-3 text-base">
              Selling{' '}
              <span className="font-display text-lg font-extrabold">
                {formatQty(qty, selected.unit)}
              </span>
              {overStock && (
                <span className="ml-2 border-[2.5px] border-ink bg-warn px-2 py-0.5 font-display font-extrabold">
                  More than stock
                </span>
              )}
            </p>

            <button
              type="button"
              onClick={saveSale}
              disabled={saving}
              className={`${NEO} mt-3 h-16 w-full bg-go font-display text-3xl font-extrabold disabled:bg-white disabled:opacity-100`}
            >
              Save Sale · {formatRupees(total)}
            </button>
          </div>
        </div>
      )}
    </>
  );
}