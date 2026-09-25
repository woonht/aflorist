import ProductCard from './ProductCard'
import { ItemMaster } from '@/types/database' // Imports interface defined in Phase 2

interface ProductGridProps {
  products: ItemMaster[];
  phoneNumber: string;
}

export default function ProductGrid({ products, phoneNumber }: ProductGridProps) {
  if (!products || products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-xl text-gray-500">No bouquets available at the moment.</p>
        <p className="mt-1 text-sm text-gray-400">Please check back soon for updates!</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 auto-rows-340px">
      {products.map((product) => (
        <ProductCard
          key={product.itemcode}
          name={product.itemname}
          imageUrl={product.imageurl || ''}
          sellingPrice={product.itemprice}
          gridW={product.gridw || 1}
          gridH={product.gridh || 1}
          phoneNumber={phoneNumber}
        />
      ))}
    </div>
  )
}