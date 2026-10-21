import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, formatRupees, toPaise, type Customer } from './db/db';
import { Field, NEO, NeoInput, cleanDecimal } from './ui';

type Errors = Partial<Record<'name' | 'phone' | 'amount', string>>;

const openWhatsApp = (phone: string, text: string) =>
  window.open(
    `https://wa.me/91${phone}?text=${encodeURIComponent(text)}`,
    '_blank',
    'noopener,noreferrer',
  );

const prettyPhone = (p: string) => `+91 ${p.slice(0, 5)} ${p.slice(5)}`;

export default function CustomerOrders({ shopName }: { shopName: string }) {
  const ledgers = useLiveQuery(
    async () =>
      (await db.customers.where('balance').above(0).toArray()).sort(
        (a, b) => b.balance - a.balance,
      ),
    [],
  );

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [addToLedger, setAddToLedger] = useState(true);
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);

  const flash = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2200);
  };

  const clearError = (key: keyof Errors) =>
    setErrors((e) => (e[key] ? { ...e, [key]: undefined } : e));

  const resetForm = () => {
    setName('');
    setPhone('');
    setAmount('');
    setErrors({});
  };

  const sendBill = async () => {
    if (saving) return;

    // 1. Validate synchronously so window.open below still counts as the tap's own action.
    const trimmed = name.trim();
    const amountPaise = amount ? toPaise(amount) : 0;
    const found: Errors = {};
    if (!trimmed) found.name = 'Enter the customer name.';
    if (!/^[6-9]\d{9}$/.test(phone)) found.phone = 'Enter a 10-digit mobile number.';
    if (amountPaise <= 0) found.amount = 'Enter an amount above 0.';
    if (Object.keys(found).length > 0) {
      setErrors(found);
      return;
    }

    // 2. Open WhatsApp first (before any await, or phone browsers block the popup).
    const previous = addToLedger ? (ledgers?.find((c) => c.phone === phone)?.balance ?? 0) : 0;
    const lines = [`Namaste ${trimmed},`, `Your bill at ${shopName}: ${formatRupees(amountPaise)}.`];
    if (addToLedger) lines.push(`Total pending: ${formatRupees(previous + amountPaise)}.`);
    lines.push('Thank you!');
    openWhatsApp(phone, lines.join('\n'));

    // 3. Record it in the ledger, one atomic transaction.
    if (!addToLedger) {
      resetForm();
      flash(`Bill sent to ${trimmed}`);
      return;
    }
    setSaving(true);
    try {
      await db.transaction('rw', db.customers, async () => {
        const existing = await db.customers.where('phone').equals(phone).first();
        const now = Date.now();
        if (existing?.id) {
          await db.customers.update(existing.id, {
            balance: existing.balance + amountPaise,
            updatedAt: now,
          });
        } else {
          await db.customers.add({ name: trimmed, phone, balance: amountPaise, updatedAt: now });
        }
      });
      resetForm();
      flash(`Bill sent. ${formatRupees(amountPaise)} added to ${trimmed}`);
    } catch {
      flash('Bill opened, but the ledger did not save. Tap again.');
    } finally {
      setSaving(false);
    }
  };

  const sendReminder = (c: Customer) =>
    openWhatsApp(
      c.phone,
      `Namaste ${c.name}, a gentle reminder from ${shopName}: your pending balance is ${formatRupees(
        c.balance,
      )}. Please pay when you can. Thank you!`,
    );

  const markPaid = async (c: Customer) => {
    if (!c.id) return;
    if (confirmId !== c.id) {
      setConfirmId(c.id);
      window.setTimeout(() => setConfirmId((cur) => (cur === c.id ? null : cur)), 3000);
      return;
    }
    setConfirmId(null);
    await db.customers.update(c.id, { balance: 0, updatedAt: Date.now() });
    flash(`${c.name} is settled`);
  };

  const totalPending = (ledgers ?? []).reduce((sum, c) => sum + c.balance, 0);

  return (
    <div className="flex flex-col gap-10">
      {/* Top half: draft bill */}
      <section className="flex flex-col gap-5">
        <h2 className="font-display text-3xl font-extrabold leading-tight">Draft bill</h2>

        <Field label="Customer name" error={errors.name}>
          <NeoInput
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              clearError('name');
            }}
            placeholder="e.g. Sharma ji"
            autoComplete="off"
          />
        </Field>

        <Field label="Phone" error={errors.phone}>
          <NeoInput
            prefix="+91"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value.replace(/\D/g, '').slice(0, 10));
              clearError('phone');
            }}
            placeholder="98765 43210"
            inputMode="tel"
            autoComplete="off"
          />
        </Field>

        <Field label="Total amount" error={errors.amount}>
          <NeoInput
            prefix="₹"
            value={amount}
            onChange={(e) => {
              setAmount(cleanDecimal(e.target.value, 2));
              clearError('amount');
            }}
            placeholder="0"
            inputMode="decimal"
          />
        </Field>

        <button
          type="button"
          role="checkbox"
          aria-checked={addToLedger}
          onClick={() => setAddToLedger((v) => !v)}
          className={`${NEO} flex h-14 items-center gap-3 bg-white px-3 text-left font-body text-lg font-medium`}
        >
          <span
            className={`flex h-8 w-8 shrink-0 items-center justify-center border-[2.5px] border-ink ${
              addToLedger ? 'bg-go' : 'bg-white'
            }`}
          >
            {addToLedger && (
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="square" aria-hidden="true">
                <path d="M4 12l5 5L20 6" />
              </svg>
            )}
          </span>
          Add to pending balance
        </button>

        <button
          type="button"
          onClick={sendBill}
          disabled={saving}
          className={`${NEO} h-16 w-full bg-go font-display text-2xl font-extrabold disabled:bg-white`}
        >
          Send Bill on WhatsApp
        </button>
      </section>

      {/* Bottom half: pending ledgers */}
      <section className="flex flex-col gap-4">
        <div className="flex items-end justify-between gap-3">
          <h2 className="font-display text-3xl font-extrabold leading-tight">Pending balances</h2>
          {totalPending > 0 && (
            <p className="border-[2.5px] border-ink bg-go px-2 py-1 font-display text-lg font-extrabold leading-tight shadow-neo">
              {formatRupees(totalPending)}
            </p>
          )}
        </div>

        {ledgers && ledgers.length === 0 && (
          <div className="border-[2.5px] border-ink bg-white p-5 shadow-neo">
            <p className="font-display text-2xl font-extrabold">All paid up</p>
            <p className="mt-1 text-lg">Bills you add to a pending balance show up here.</p>
          </div>
        )}

        <ul className="flex flex-col gap-4">
          {ledgers?.map((c) => {
            const confirming = confirmId === c.id;
            return (
              <li key={c.id} className="border-[2.5px] border-ink bg-white p-4 shadow-neo">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate font-display text-2xl font-extrabold leading-tight">
                      {c.name}
                    </h3>
                    <p className="text-base">{prettyPhone(c.phone)}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-base">You'll get</p>
                    <p className="font-display text-3xl font-extrabold leading-none">
                      {formatRupees(c.balance)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => sendReminder(c)}
                    className={`${NEO} h-14 flex-1 bg-warn font-display text-xl font-extrabold`}
                  >
                    Send Reminder
                  </button>
                  <button
                    type="button"
                    onClick={() => markPaid(c)}
                    className={`${NEO} h-14 w-32 font-display text-lg font-extrabold leading-tight ${
                      confirming ? 'bg-danger' : 'bg-white'
                    }`}
                  >
                    {confirming ? 'Tap to confirm' : 'Mark paid'}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {toast && (
        <div
          role="status"
          className="fixed inset-x-4 bottom-28 z-40 border-[2.5px] border-ink bg-warn px-4 py-3 font-display text-lg font-extrabold shadow-neo"
        >
          {toast}
        </div>
      )}
    </div>
  );
}