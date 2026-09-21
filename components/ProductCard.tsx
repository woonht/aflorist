'use client'

import Image from 'next/image'

interface ProductCardProps {
  name: string;
  imageUrl: string;
  sellingPrice: number;
  gridW?: number;
  gridH?: number;
  phoneNumber: string;
}

export default function ProductCard({
  name,
  imageUrl,
  sellingPrice,
  gridW = 1,
  gridH = 1,
  phoneNumber,
}: ProductCardProps) {
  // Build a specific WhatsApp order message for this specific bouquet
  const orderMessage = encodeURIComponent(
    `Hi! I am interested in ordering the bouquet: "${name}" priced at RM${sellingPrice.toFixed(2)}.`
  )
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${orderMessage}`

  // Map database GridW and GridH to Tailwind CSS column and row spans
  const colSpanClass = gridW === 2 ? 'md:col-span-2' : 'col-span-1'
  const rowSpanClass = gridH === 2 ? 'md:row-span-2' : 'row-span-1'

  return (
    <div
      className={`group relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${colSpanClass} ${rowSpanClass}`}
    >
      {/* Bouquet Image Container */}
      <div className="relative w-full flex-1 min-h-260px bg-gray-100 overflow-hidden">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            unoptimized // Useful during local testing if external images aren't domain-whitelisted in next.config.js
          />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-400">
            No Image Available
          </div>
        )}
      </div>

      {/* Card Details: Shows ONLY Product Name, Selling Price, and Direct Order Action */}
      <div className="flex items-center justify-between p-4 bg-white">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 group-hover:text-pink-600 transition-colors">
            {name}
          </h3>
          <p className="text-xl font-bold text-pink-600">
            RM {sellingPrice.toFixed(2)}
          </p>
        </div>

        {/* Quick Order Button for Guests */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-xl bg-pink-50 px-3 py-2 text-xs font-semibold text-pink-600 transition-colors hover:bg-pink-600 hover:text-white"
        >
          Order via WA
        </a>
      </div>
    </div>
  )
}