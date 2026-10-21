import { useState } from 'react';

// Synthetic Data for the Demo
const DEMO_INVENTORY = [
  { id: 1, name: 'Amul Taaza Milk 500ml', price: 28 },
  { id: 2, name: 'Paneer 200g', price: 85 },
  { id: 3, name: 'Parle-G Gold', price: 20 },
  { id: 4, name: 'Aashirvaad Atta 5kg', price: 230 }
];

const DEMO_CUSTOMERS = [
  { id: 1, name: 'Sharma Ji', phone: '9876543210', pending: 450, lastDate: 'Today' },
  { id: 2, name: 'Verma Aunty', phone: '9876543211', pending: 120, lastDate: 'Yesterday' },
];

export default function CustomerOrders({ shopName }: { shopName: string }) {
  const [customer, setCustomer] = useState('');
  const [phone, setPhone] = useState('');
  const [cart, setCart] = useState<{name: string, qty: number, price: number}[]>([]);
  const [selectedItem, setSelectedItem] = useState(DEMO_INVENTORY[0].id);
  const [qty, setQty] = useState(1);

  const totalBill = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

  const handleAddItem = () => {
    const item = DEMO_INVENTORY.find(i => i.id === selectedItem);
    if (item) {
      setCart([...cart, { name: item.name, price: item.price, qty }]);
    }
  };

  const sendWhatsApp = () => {
    if (!phone || cart.length === 0) return alert("Add phone and items!");
    let msg = `*${shopName} - Aapka Bill*\nNamaste ${customer},\n\n`;
    cart.forEach(item => {
      msg += `${item.name} x ${item.qty} = ₹${item.price * item.qty}\n`;
    });
    msg += `\n*Total Amount: ₹${totalBill}*\n\nPlease pay via UPI.`;
    window.open(`https://wa.me/91${phone}?text=${encodeURIComponent(msg)}`);
  };

  return (
    <div className="flex flex-col gap-6 text-white pb-20">
      {/* Generate Bill Section */}
      <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/20 shadow-lg">
        <h2 className="text-xl font-extrabold mb-4 text-[#00E676]">Generate New Bill</h2>
        
        <input type="text" placeholder="Customer Name (e.g. Sharma Ji)" value={customer} onChange={e => setCustomer(e.target.value)} className="w-full p-3 mb-3 bg-black/30 rounded-xl border border-white/20 text-white placeholder-white/50" />
        <input type="tel" placeholder="Phone Number (+91)" value={phone} onChange={e => setPhone(e.target.value)} className="w-full p-3 mb-4 bg-black/30 rounded-xl border border-white/20 text-white placeholder-white/50" />

        <div className="flex gap-2 mb-4">
          <select value={selectedItem} onChange={e => setSelectedItem(Number(e.target.value))} className="flex-1 p-3 bg-black/50 rounded-xl border border-white/20 text-white">
            {DEMO_INVENTORY.map(item => <option key={item.id} value={item.id}>{item.name} - ₹{item.price}</option>)}
          </select>
          <input type="number" min="1" value={qty} onChange={e => setQty(Number(e.target.value))} className="w-20 p-3 bg-black/30 rounded-xl border border-white/20 text-white text-center" />
          <button onClick={handleAddItem} className="bg-blue-500 p-3 rounded-xl font-bold">+</button>
        </div>

        {cart.length > 0 && (
          <div className="mb-4 bg-black/20 p-3 rounded-xl border border-white/10">
            {cart.map((c, i) => (
              <div key={i} className="flex justify-between text-sm mb-1">
                <span>{c.qty}x {c.name}</span>
                <span>₹{c.price * c.qty}</span>
              </div>
            ))}
            <div className="border-t border-white/20 mt-2 pt-2 flex justify-between font-bold text-[#00E676] text-lg">
              <span>Total:</span>
              <span>₹{totalBill}</span>
            </div>
          </div>
        )}

        <button onClick={sendWhatsApp} className="w-full p-4 bg-[#00E676] text-black font-extrabold rounded-xl active:scale-95 transition-transform shadow-lg">
          Send Bill on WhatsApp
        </button>
      </div>

      {/* Customer Management Section */}
      <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/20 shadow-lg">
        <h2 className="text-xl font-extrabold mb-4 text-[#FFD600]">Pending Khata (Ledger)</h2>
        {DEMO_CUSTOMERS.map(c => (
          <div key={c.id} className="flex justify-between items-center mb-3 bg-black/20 p-4 rounded-xl border border-white/10">
            <div>
              <p className="font-bold">{c.name}</p>
              <p className="text-xs text-white/60">Last updated: {c.lastDate}</p>
            </div>
            <div className="text-right">
              <p className="font-extrabold text-[#FF3D00]">₹{c.pending}</p>
              <button className="text-xs bg-yellow-500 text-black px-3 py-1 rounded-md mt-1 font-bold">Remind</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}