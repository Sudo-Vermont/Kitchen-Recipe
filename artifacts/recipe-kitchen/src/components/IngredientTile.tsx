import { Apple, Carrot, CircleDot, Egg, Fish, Leaf, Package, Soup, Sprout, UtensilsCrossed, Wheat } from 'lucide-react';
import type { Ingredient } from '@workspace/api-client-react';

const tileTones = [
  'bg-[#f7ded9] text-[#b4544c]',
  'bg-[#f6e7d6] text-[#a5673f]',
  'bg-[#f3ded2] text-[#a15b45]',
  'bg-[#f8e9e2] text-[#b06a5c]',
];

const ingredientImages: Array<[string[], string]> = [
  [['apple'], 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=480&q=85'],
  [['avocado'], 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?auto=format&fit=crop&w=480&q=85'],
  [['beef', 'steak'], 'https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=480&q=85'],
  [['bread'], 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=480&q=85'],
  [['carrot'], 'https://images.unsplash.com/photo-1445282768818-728615cc910a?auto=format&fit=crop&w=480&q=85'],
  [['chicken'], 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=480&q=85'],
  [['cucumber'], 'https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?auto=format&fit=crop&w=480&q=85'],
  [['egg'], 'https://images.unsplash.com/photo-1582722872445-44dc5e7be60f?auto=format&fit=crop&w=480&q=85'],
  [['garlic'], 'https://images.unsplash.com/photo-1540148426945-6cf22a6b2383?auto=format&fit=crop&w=480&q=85'],
  [['lemon'], 'https://images.unsplash.com/photo-1547514701-42782101795e?auto=format&fit=crop&w=480&q=85'],
  [['lettuce', 'spinach', 'leaf'], 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=480&q=85'],
  [['milk'], 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=480&q=85'],
  [['onion'], 'https://images.unsplash.com/photo-1508747703725-719777637510?auto=format&fit=crop&w=480&q=85'],
  [['pasta'], 'https://images.unsplash.com/photo-1556761223-4c4282c73f77?auto=format&fit=crop&w=480&q=85'],
  [['potato'], 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=480&q=85'],
  [['rice'], 'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?auto=format&fit=crop&w=480&q=85'],
  [['salmon', 'fish'], 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=480&q=85'],
  [['tomato'], 'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?auto=format&fit=crop&w=480&q=85'],
];

function getIngredientImage(name: string): string | undefined {
  const lower = name.toLowerCase();
  return ingredientImages.find(([keywords]) => keywords.some((keyword) => lower.includes(keyword)))?.[1];
}

function IngredientGlyph({ name }: { name: string }) {
  const lower = name.toLowerCase();
  const props = { className: 'h-11 w-11', strokeWidth: 1.35 };
  if (lower.includes('apple')) return <Apple {...props} />;
  if (lower.includes('carrot')) return <Carrot {...props} />;
  if (lower.includes('egg')) return <Egg {...props} />;
  if (lower.includes('fish') || lower.includes('salmon') || lower.includes('tuna')) return <Fish {...props} />;
  if (lower.includes('leaf') || lower.includes('spinach') || lower.includes('lettuce') || lower.includes('basil')) return <Leaf {...props} />;
  if (lower.includes('wheat') || lower.includes('flour') || lower.includes('bread') || lower.includes('rice')) return <Wheat {...props} />;
  if (lower.includes('soup') || lower.includes('broth') || lower.includes('stock')) return <Soup {...props} />;
  if (lower.includes('bean') || lower.includes('pea') || lower.includes('herb')) return <Sprout {...props} />;
  if (lower.includes('chicken') || lower.includes('beef') || lower.includes('meat')) return <UtensilsCrossed {...props} />;
  if (lower.includes('oil') || lower.includes('salt') || lower.includes('sugar')) return <Package {...props} />;
  return <CircleDot {...props} />;
}

export function IngredientTile({ ingredient, index = 0, compact = false }: { ingredient: Ingredient; index?: number; compact?: boolean }) {
  const imageUrl = getIngredientImage(ingredient.name);
  return (
    <div className={`relative flex shrink-0 flex-col items-center justify-center overflow-hidden border border-card-border ${compact ? 'h-[102px] w-[102px] p-2.5' : 'min-h-[142px] p-3'} ${tileTones[index % tileTones.length]}`}>
      {imageUrl && <img src={imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />}
      <div className={`absolute inset-0 ${imageUrl ? 'bg-gradient-to-t from-black/70 via-black/15 to-transparent' : ''}`} />
      <div className={`relative z-10 flex flex-col items-center ${imageUrl ? 'text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]' : ''}`}>
        {!imageUrl && <IngredientGlyph name={ingredient.name} />}
        <p className="mt-2 line-clamp-2 text-center text-[11px] font-semibold leading-tight">{ingredient.name}</p>
        <p className="mt-1 line-clamp-1 max-w-full text-center text-[9px] uppercase tracking-[0.04em] opacity-80">{ingredient.quantity}</p>
      </div>
    </div>
  );
}