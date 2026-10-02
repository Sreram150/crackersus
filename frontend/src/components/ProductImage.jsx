import { useState } from 'react';

const HUES = [14, 340, 265, 200, 38, 150];

export default function ProductImage({ product, className = '' }) {
  const [bad, setBad] = useState(false);
  if (product.image_src && !bad) {
    return <img className={className} src={product.image_src} alt={product.name} loading="lazy" onError={() => setBad(true)} />;
  }
  const h = HUES[product.id % HUES.length];
  return (
    <div className={`ph ${className}`} style={{ background: `linear-gradient(135deg, hsl(${h} 80% 25%), hsl(${(h + 40) % 360} 85% 45%))` }}>
      <span>{product.category_icon || '🎆'}</span>
    </div>
  );
}
