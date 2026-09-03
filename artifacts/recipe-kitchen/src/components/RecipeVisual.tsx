import { Apple, Carrot, Leaf, UtensilsCrossed } from 'lucide-react';
import type { Recipe } from '@workspace/api-client-react';

const tones = [
  'from-[#f9a29c] via-[#f6bdb3] to-[#f7ddcf]',
  'from-[#e9b48c] via-[#f0cfae] to-[#f7e7d2]',
  'from-[#f08d86] via-[#f4b0a2] to-[#f8d9c6]',
  'from-[#d9a67f] via-[#ecc39f] to-[#f6e3cb]',
];

export function RecipeVisual({ recipe, className = '' }: { recipe: Recipe; className?: string }) {
  const tone = tones[recipe.id % tones.length];
  return (
    <div className={`relative overflow-hidden bg-gradient-to-br ${tone} ${className}`}>
      {recipe.imageUrl ? (
        <img
          src={recipe.imageUrl}
          alt={recipe.title}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <>
          <div className="absolute -right-14 -top-16 h-56 w-56 rounded-full border-[22px] border-white/25" />
          <div className="absolute -bottom-24 -left-10 h-60 w-60 rounded-full border-[26px] border-black/5" />
          <div className="absolute left-[20%] top-[17%] flex h-36 w-36 items-center justify-center rounded-full bg-white/30">
            {recipe.category.toLowerCase().includes('salad') ? <Leaf className="h-20 w-20 text-white/80" strokeWidth={1.1} /> : recipe.title.toLowerCase().includes('apple') ? <Apple className="h-20 w-20 text-white/80" strokeWidth={1.1} /> : recipe.title.toLowerCase().includes('carrot') ? <Carrot className="h-20 w-20 text-white/80" strokeWidth={1.1} /> : <UtensilsCrossed className="h-20 w-20 text-white/80" strokeWidth={1.1} />}
          </div>
        </>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
    </div>
  );
}
