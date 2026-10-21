import { useState, type ReactNode } from 'react';
import QuickSale from './Quicksale';
import AddItem from './Additem';
import CustomerOrders from './Customerorders';
import VoiceSale from './Voicesale';

type TabId = 'sale' | 'add' | 'orders';

const SHOP_NAME = 'Nitya Traders';

const TABS: { id: TabId; label: string; icon: ReactNode }[] = [
  {
    id: 'sale',
    label: 'Home (Sale)',
    icon: (
      <path d="M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10" />
    ),
  },
  {
    id: 'add',
    label: 'Add Item',
    icon: <path d="M12 4v16M4 12h16" />,
  },
  {
    id: 'orders',
    label: 'Orders',
    icon: <path d="M5 7h14M5 12h14M5 17h9" />,
  },
];

/* Shared neobrutalist press behaviour: 4px 4px shadow, translates into it on :active. */
const NEO =
  'border-[2.5px] border-ink shadow-neo transition-none ' +
  'active:translate-x-1 active:translate-y-1 active:shadow-none';

export default function App() {
  const [tab, setTab] = useState<TabId>('sale');

  return (
    <div className="flex min-h-dvh flex-col bg-cream font-body font-medium text-ink">
      {/* Sticky top header */}
      <header className="sticky top-0 z-20 border-b-[2.5px] border-ink bg-go px-4 pb-3 pt-[calc(0.75rem+env(safe-area-inset-top))]">
        <h1 className="font-display text-3xl font-extrabold leading-none">{SHOP_NAME}</h1>
        <p className="mt-1 font-body text-base font-medium">Dukaan Dairy</p>
      </header>

      {/* Tab content: padded so nothing hides behind the fixed bars */}
      <main className="flex-1 px-4 pb-32 pt-5">
        {tab === 'sale' && (
          <div className="flex flex-col gap-5">
            <VoiceSale />
            <QuickSale onAddItem={() => setTab('add')} />
          </div>
        )}
        {tab === 'add' && <AddItem />}
        {tab === 'orders' && <CustomerOrders shopName={SHOP_NAME} />}
      </main>

      {/* Sticky bottom navigation */}
      <nav
        aria-label="Main"
        className="sticky bottom-0 z-20 border-t-[2.5px] border-ink bg-cream px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3"
      >
        <ul className="grid grid-cols-3 gap-3">
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => setTab(t.id)}
                  aria-current={active ? 'page' : undefined}
                  className={`${NEO} flex h-16 w-full flex-col items-center justify-center gap-1 px-1 font-display text-sm font-extrabold leading-none ${
                    active
                      ? 'translate-x-1 translate-y-1 bg-go shadow-none'
                      : 'bg-white'
                  }`}
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="square"
                    strokeLinejoin="miter"
                    aria-hidden="true"
                  >
                    {t.icon}
                  </svg>
                  {t.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}