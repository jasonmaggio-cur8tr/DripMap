
import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Shop } from '../types';

interface ShopCardProps {
    shop: Shop;
}

const ShopCard: React.FC<ShopCardProps> = ({ shop }) => {
    const [isHovered, setIsHovered] = useState(false);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // We only render the full gallery if the user has interacted (hovered/touched)
    // or if there's only one image (no need to defer)
    const shouldLoadGallery = isHovered || shop.gallery.length <= 1;

    const handleInteraction = () => {
        if (!isHovered) {
            setIsHovered(true);
        }
    };

    return (
        <Link
            to={`/shop/${shop.id}`}
            className="block group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all border border-coffee-100 hover:border-volt-400/50"
            onMouseEnter={handleInteraction}
            onTouchStart={handleInteraction}
            onFocus={handleInteraction}
        >
            <div
                ref={scrollContainerRef}
                className="relative aspect-[4/5] overflow-x-auto flex snap-x snap-mandatory no-scrollbar"
            >
                {/* Always render the first image (Featured) */}
                <div className="w-full flex-shrink-0 snap-center relative h-full">
                    <img
                        src={shop.gallery[0]?.url}
                        alt={`${shop.name} - Featured`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        decoding="async"
                    />

                    {/* Overlays on the first image */}
                    {shop.isClaimed && (
                        <div className="absolute top-3 right-3 bg-volt-400 text-coffee-900 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-sm z-10">
                            <i className="fas fa-check-circle"></i> CLAIMED
                        </div>
                    )}
                    <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm text-white px-2 py-1 rounded-lg text-xs font-bold flex items-center z-10">
                        <i className="fas fa-star text-volt-400 mr-1"></i> {shop.rating.toFixed(1)}
                    </div>
                </div>

                {/* Deferred images - only render if interacted */}
                {shouldLoadGallery && shop.gallery.slice(1).map((image, index) => (
                    <div key={index + 1} className="w-full flex-shrink-0 snap-center relative h-full">
                        <img
                            src={image.url}
                            alt={`${shop.name} - Photo ${index + 2}`}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            decoding="async"
                        />
                    </div>
                ))}
            </div>

            <div className="p-4">
                <div className="flex justify-between items-start">
                    <h3 className="text-lg font-bold font-serif text-coffee-900 mb-1 group-hover:text-coffee-800">{shop.name}</h3>
                    <span className="text-[10px] font-bold bg-coffee-100 text-coffee-600 px-2 py-1 rounded uppercase tracking-wider">{shop.location.city}</span>
                </div>
                <p className="text-xs text-coffee-800/70 mb-3 flex items-center">
                    <i className="fas fa-map-marker-alt mr-1.5"></i> {shop.location.address}
                </p>
                <div className="flex flex-wrap gap-1.5">
                    {shop.vibes.slice(0, 3).map(v => (
                        <span key={v} className="text-[10px] bg-coffee-50 text-coffee-800 px-2 py-0.5 rounded-md border border-coffee-200">
                            {v}
                        </span>
                    ))}
                </div>
            </div>
        </Link>
    );
};

export default ShopCard;
