
import React from 'react';
import { Shop } from '../types';

interface MapPlaceholderProps {
  shops: Shop[];
  onShopClick: (shopId: string) => void;
}

const MapPlaceholder: React.FC<MapPlaceholderProps> = ({ shops, onShopClick }) => {
  return (
    <div className="relative w-full h-full bg-coffee-100 overflow-hidden group">
      {/* Simulated Map Background Pattern */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
            backgroundImage: 'radial-gradient(#3c2f26 1px, transparent 1px)',
            backgroundSize: '20px 20px'
        }}
      />
      
      {/* Decorative Map Elements */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] border-2 border-coffee-200 rounded-[50%] opacity-10 pointer-events-none"></div>
      <div className="absolute top-1/3 left-1/3 w-64 h-64 bg-volt-400 rounded-full filter blur-[100px] opacity-20 mix-blend-multiply pointer-events-none"></div>

      {/* Simulated Pins */}
      {shops.map((shop, index) => {
        // Deterministic random position for demo based on index
        const top = 20 + (index * 15) % 60;
        const left = 20 + (index * 25) % 60;
        
        return (
          <button
            key={shop.id}
            onClick={() => onShopClick(shop.id)}
            className="absolute transform -translate-x-1/2 -translate-y-full hover:scale-110 transition-transform duration-300 group/pin"
            style={{ top: `${top}%`, left: `${left}%` }}
          >
            <div className="relative">
                <div className="w-8 h-8 bg-coffee-900 rounded-full flex items-center justify-center shadow-xl border-2 border-white z-10">
                    <i className="fas fa-coffee text-volt-400 text-xs"></i>
                </div>
                <div className="absolute top-full left-1/2 -translate-x-1/2 w-1 h-4 bg-coffee-900"></div>
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-4 w-10 h-2 bg-black/20 rounded-[50%] blur-[2px]"></div>
                
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[150px] bg-white px-3 py-2 rounded-lg shadow-xl opacity-0 group-hover/pin:opacity-100 transition-opacity duration-200 pointer-events-none z-20">
                    <p className="text-xs font-bold text-coffee-900">{shop.name}</p>
                    <div className="flex items-center gap-1 text-[10px] text-coffee-800/70">
                        <i className="fas fa-star text-yellow-500"></i> {shop.rating}
                    </div>
                </div>
            </div>
          </button>
        );
      })}

      <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur px-4 py-2 rounded-lg shadow-sm text-xs text-coffee-800">
        <i className="fas fa-info-circle mr-1"></i> Interactive Demo Map
      </div>
    </div>
  );
};

export default MapPlaceholder;
