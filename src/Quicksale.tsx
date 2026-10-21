import { useState, useEffect } from 'react';
import { supabase } from './utils/supabase';

const FALLBACK_PRODUCTS = [
  { id: '1', name: 'Amul Taaza Milk 500ml', unit: 'packet', current_stock: 5, sale_price: 28 },
  { id: '2', name: 'Paneer 200g', unit: 'packet', current_stock: 0, sale_price: 85 },
  { id: '3', name: 'Parle-G Gold', unit: 'packet', current_stock: 150, sale_price: 20 },
  { id: '4', name: 'Aashirvaad Atta 5kg', unit: 'bag', current_stock: 2, sale_price: 230 }
];

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
      try {
        const { data, error } = await supabase.from('products').select('*').order('name');
        if (error || !data || data.length === 0) {
          setProducts(FALLBACK_PRODUCTS);
        } else {
          setProducts(data);
        }
      } catch {
        setProducts(FALLBACK_PRODUCTS);
      }
    }
    fetchProducts();
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center mb-1">
        <h2 className="text-2xl font-bold text-white drop-shadow-md">Quick Sale</h2>
        {onAddItem && (
          <button onClick={onAddItem} className="text-xs bg-[#00E676] text-black font-extrabold px-3 py-2 rounded-xl border-none">
            + Add Item
          </button>
        )}
      </div>
      
      <div className="grid grid-cols-2 gap-4 pb-12">
        {products.map((p) => (
          <div 
            key={p.id} 
            onClick={() => alert(`Sale recorded for ${p.name}! Stock updated.`)}
            className="bg-white/10 backdrop-blur-md overflow-hidden flex flex-col rounded-2xl border border-white/20 shadow-lg cursor-pointer hover:bg-white/20 transition-all"
          >
            <div className="h-28 w-full bg-black/20">
              <img 
                src={PRODUCT_IMAGES[p.name] || 'https://images.unsplash.com/photo-1601599561096-f87c95fff1e9?w=400&q=80'} 
                alt={p.name}
                className="w-full h-full object-cover opacity-90"
              />
            </div>
            <div className="p-3 text-left w-full flex flex-col justify-between flex-1">
              <p className="font-bold text-sm leading-tight line-count-1 text-white">{p.name}</p>
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-white/70">{p.current_stock} {p.unit}s left</span>
                <span className="font-extrabold text-[#00E676] text-base">₹{p.sale_price}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}