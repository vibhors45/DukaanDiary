import { useEffect, useState } from 'react';
import { supabase } from './utils/supabase';

// High-quality stock images matched to your DB products
const PRODUCT_IMAGES: Record<string, string> = {
  'Amul Taaza Milk 500ml': 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&q=80',
  'Paneer 200g': 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400&q=80',
  'Parle-G Gold': 'https://images.unsplash.com/photo-1599508704512-2f19efd1e35f?w=400&q=80',
  'Aashirvaad Atta 5kg': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80'
};

export default function QuickSale({ onAddItem }: { onAddItem?: () => void }) {
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    async function fetchProducts() {
      const { data } = await supabase.from('products').select('*').order('name');
      if (data) setProducts(data);
    }
    fetchProducts();
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-2xl font-bold mb-2 text-white drop-shadow-md">Quick Sale</h2>
      
      {products.length === 0 ? (
        <div className="glass-panel p-6 text-center">Loading Inventory...</div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {products.map((p) => (
            <button 
              key={p.id} 
              className="glass-panel overflow-hidden flex flex-col p-0 h-48 border-none!"
              onClick={() => alert(`Sold 1 ${p.unit} of ${p.name}!`)}
            >
              <div className="h-28 w-full bg-white/5">
                <img 
                  src={PRODUCT_IMAGES[p.name] || 'https://images.unsplash.com/photo-1601599561096-f87c95fff1e9?w=400&q=80'} 
                  alt={p.name}
                  className="w-full h-full object-cover opacity-90"
                />
              </div>
              <div className="p-3 text-left w-full">
                <p className="font-bold text-sm leading-tight line-clamp-1">{p.name}</p>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-white/70">{p.current_stock} {p.unit}s left</span>
                  <span className="font-extrabold text-[#00E676]">₹{p.sale_price}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}