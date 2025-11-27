
import React, { useState } from 'react';
import { Product, ProductCategory } from '../types';
import { convertToDirectImageURL, formatCurrency } from '../utils';
import { X, Search, Info, MessageCircle, Star } from 'lucide-react';

interface PublicViewProps {
  products: Product[];
}

interface ProductCardProps {
  product: Product;
  onOpenModal: (p: Product) => void;
}

// Internal component for Card Logic (Swipe)
const ProductCard: React.FC<ProductCardProps> = ({ product, onOpenModal }) => {
  const [currentImgIndex, setCurrentImgIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const images = product.images && product.images.length > 0 ? product.images : [];
  
  const pricePerBox = (product.price || 0) * (product.yield || 1);

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      setCurrentImgIndex((prev) => (prev + 1) % images.length);
    } else if (isRightSwipe) {
      setCurrentImgIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    }
  };

  return (
    <div className="bg-slate-800 rounded-2xl shadow-xl overflow-hidden group flex flex-col h-full border border-slate-700 hover:border-primary/50 transition-all duration-300 hover:translate-y-[-4px] relative">
      {!!product.isFeatured && (
        <div className="absolute top-0 left-4 z-20">
            <div className="bg-yellow-500 text-black text-[10px] font-bold px-2 py-1 rounded-b-md shadow-lg flex items-center gap-1">
                <Star className="w-3 h-3 fill-black" />
                DESTACADO
            </div>
        </div>
      )}
      <div 
        className="relative aspect-[4/3] overflow-hidden bg-slate-900 touch-pan-y"
        onTouchStart={images.length > 1 ? onTouchStart : undefined}
        onTouchMove={images.length > 1 ? onTouchMove : undefined}
        onTouchEnd={images.length > 1 ? onTouchEnd : undefined}
      >
        {images.length > 0 ? (
            <>
              <img 
                src={convertToDirectImageURL(images[currentImgIndex])} 
                alt={product.name} 
                className="w-full h-full object-cover transition-transform duration-700 ease-in-out"
                draggable={false}
                onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400?text=Sin+Imagen' }}
              />
              {images.length > 1 && (
                <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-20 pointer-events-none">
                  {images.map((_, idx) => (
                    <div 
                      key={idx} 
                      className={`w-1.5 h-1.5 rounded-full transition-all shadow-sm ${idx === currentImgIndex ? 'bg-white scale-125 w-2' : 'bg-white/40'}`}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-600 bg-slate-900">
              <span>Sin Imagen</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-transparent opacity-60 pointer-events-none" />
          
          <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-white border border-white/10 shadow-lg pointer-events-none">
            {product.category || 'General'}
          </div>
      </div>
      
      <div className="p-5 flex flex-col flex-grow relative">
        <h3 className="font-bold text-white text-xl leading-tight mb-1 font-sans tracking-tight">{product.name || 'Producto Sin Nombre'}</h3>
        <div className="text-xs text-slate-400 mb-4 flex gap-2">
            <span>{product.format || '-'}</span>
            <span>•</span>
            <span>{product.finish || '-'}</span>
        </div>
        
        <div className="mt-auto space-y-3">
          <div className="flex items-end justify-between border-b border-slate-700 pb-2">
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Precio m² <span className="text-[10px] opacity-60">(IVA Inc.)</span></span>
            <span className="text-3xl font-bold text-emerald-400 tracking-tight">{formatCurrency(product.price || 0)}</span>
          </div>

          <div className="flex items-end justify-between">
              <div className="flex flex-col">
                <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Precio Caja</span>
                <span className="text-[10px] text-slate-500">Rend: {product.yield || 0} m²</span>
              </div>
              <span className="text-lg font-bold text-white">{formatCurrency(pricePerBox)}</span>
          </div>

          <button 
            onClick={() => onOpenModal(product)}
            className="w-full bg-primary hover:bg-primary-hover text-white py-3 rounded-lg text-sm font-bold uppercase tracking-wide transition-colors flex items-center justify-center gap-2 mt-4 shadow-lg shadow-primary/20"
          >
            <Info className="w-4 h-4" />
            Ver Detalles
          </button>
        </div>
      </div>
    </div>
  );
};

const PublicView: React.FC<PublicViewProps> = ({ products }) => {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeImage, setActiveImage] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('DESTACADOS'); 
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProducts = products.filter(p => {
    let matchesCategory = false;
    
    if (filterCategory === 'TODOS') {
        matchesCategory = true;
    } else if (filterCategory === 'DESTACADOS') {
        // Logic simplified: if boolean is true, it shows.
        // The service layer guarantees p.isFeatured is strictly true/false.
        matchesCategory = !!p.isFeatured;
    } else {
        matchesCategory = p.category === filterCategory;
    }
    
    const nameSafe = (p.name || '').toLowerCase();
    const codeSafe = (p.code || '').toLowerCase();
    const termSafe = searchTerm.toLowerCase();
    
    const matchesSearch = nameSafe.includes(termSafe) || codeSafe.includes(termSafe);
                          
    return matchesCategory && matchesSearch;
  });

  const handleOpenModal = (product: Product) => {
    setSelectedProduct(product);
    setActiveImage(product.images && product.images.length > 0 ? product.images[0] : '');
  };

  const handleCloseModal = () => {
    setSelectedProduct(null);
    setActiveImage('');
  };

  return (
    <div className="pb-12 animate-fade-in bg-slate-900 min-h-screen px-4 -mx-4 sm:-mx-6 lg:-mx-8">
      <div className="max-w-7xl mx-auto pt-8">
        <div className="mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="grid grid-cols-3 md:flex md:flex-row gap-2 w-full md:w-auto">
             <button 
              onClick={() => setFilterCategory('DESTACADOS')}
              className={`px-2 md:px-4 py-2 rounded-lg md:rounded-full text-xs md:text-sm font-bold transition-all duration-300 flex items-center justify-center text-center leading-tight h-10 gap-1.5 ${filterCategory === 'DESTACADOS' ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/30 ring-2 ring-yellow-400' : 'bg-slate-800 text-yellow-500 hover:bg-slate-700 border border-yellow-500/30'}`}
            >
              <Star className={`w-3 h-3 md:w-4 md:h-4 ${filterCategory === 'DESTACADOS' ? 'fill-black' : 'fill-yellow-500'}`} />
              Destacados
            </button>

            <button 
              onClick={() => setFilterCategory('TODOS')}
              className={`px-2 md:px-4 py-2 rounded-lg md:rounded-full text-xs md:text-sm font-medium transition-all duration-300 flex items-center justify-center text-center leading-tight h-10 ${filterCategory === 'TODOS' ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'}`}
            >
              Todos
            </button>
            {Object.values(ProductCategory).map(cat => (
              <button 
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-2 md:px-4 py-2 rounded-lg md:rounded-full text-xs md:text-sm font-medium transition-all duration-300 flex items-center justify-center text-center leading-tight h-10 ${filterCategory === cat ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'}`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="relative w-full md:w-64 mt-2 md:mt-0">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Buscar producto..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-full bg-slate-800 border border-slate-700 text-slate-200 text-sm focus:ring-2 focus:ring-primary focus:outline-none placeholder-slate-500 shadow-sm"
            />
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            <p className="text-xl">No encontramos productos en esta sección.</p>
            {filterCategory === 'DESTACADOS' && <p className="text-sm mt-2 text-slate-600">Marca productos como destacados en el panel de administración.</p>}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProducts.map(product => (
               <ProductCard key={product.id || Math.random()} product={product} onOpenModal={handleOpenModal} />
            ))}
          </div>
        )}

        {selectedProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative flex flex-col md:flex-row overflow-hidden border border-slate-700">
              <button 
                onClick={handleCloseModal}
                className="absolute top-4 right-4 z-10 p-2 bg-black/50 text-white rounded-full hover:bg-white/20 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="w-full md:w-1/2 bg-slate-900 p-6 flex flex-col gap-4">
                <div className="aspect-square rounded-xl overflow-hidden bg-black shadow-inner border border-slate-800 relative">
                   {activeImage ? (
                      <img 
                        src={convertToDirectImageURL(activeImage)} 
                        alt={selectedProduct.name} 
                        className="w-full h-full object-cover transition-opacity duration-300"
                        onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/600?text=Error+Carga' }}
                      />
                   ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-600">
                        <span>Sin Imagen</span>
                      </div>
                   )}
                </div>
                {selectedProduct.images && selectedProduct.images.length > 1 && (
                  <div className="grid grid-cols-4 gap-2">
                    {selectedProduct.images.map((img, idx) => (
                      <div 
                        key={idx} 
                        className={`aspect-square rounded-lg overflow-hidden border cursor-pointer transition-all ${activeImage === img ? 'border-primary ring-2 ring-primary/30' : 'border-slate-700 hover:border-slate-500'}`}
                        onClick={() => setActiveImage(img)}
                      >
                        <img 
                          src={convertToDirectImageURL(img)} 
                          alt={`Thumbnail ${idx}`} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="w-full md:w-1/2 p-8 flex flex-col text-slate-200">
                <div className="mb-auto">
                  <div className="flex gap-2 mb-3">
                     <span className="inline-block px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-bold rounded-full border border-emerald-500/20">
                        {selectedProduct.category || 'Categoría'}
                     </span>
                     {!!selectedProduct.isFeatured && (
                        <span className="inline-block px-3 py-1 bg-yellow-500/20 text-yellow-400 text-xs font-bold rounded-full border border-yellow-500/30 flex items-center gap-1">
                            <Star className="w-3 h-3 fill-yellow-400" />
                            DESTACADO
                        </span>
                     )}
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-2">{selectedProduct.name}</h2>
                  
                  <div className="bg-slate-700/50 p-4 rounded-xl mb-6 border border-slate-600">
                      <div className="flex items-baseline justify-between mb-1">
                        <span className="text-sm text-slate-400 uppercase font-semibold">Precio m²</span>
                        <span className="text-3xl font-bold text-emerald-400">{formatCurrency(selectedProduct.price || 0)}</span>
                      </div>
                      <div className="flex items-baseline justify-between border-t border-slate-600 pt-2 mt-2">
                         <span className="text-xs text-slate-300">Precio Caja ({selectedProduct.yield || 0} m²)</span>
                         <span className="text-xl font-bold text-white">{formatCurrency((selectedProduct.price || 0) * (selectedProduct.yield || 1))}</span>
                      </div>
                      <div className="text-[10px] text-right text-slate-500 mt-1">IVA incluido</div>
                  </div>

                  <div className="space-y-4 mb-8 text-sm">
                    <div className="flex border-b border-slate-700 py-2">
                      <span className="text-slate-500 w-32">Código</span>
                      <span className="font-medium text-slate-200">{selectedProduct.code || '-'}</span>
                    </div>
                    <div className="flex border-b border-slate-700 py-2">
                      <span className="text-slate-500 w-32">Formato</span>
                      <span className="font-medium text-slate-200">{selectedProduct.format || '-'}</span>
                    </div>
                    <div className="flex border-b border-slate-700 py-2">
                      <span className="text-slate-500 w-32">Rendimiento</span>
                      <span className="font-medium text-slate-200">{selectedProduct.yield || 0} m²/caja</span>
                    </div>
                    <div className="flex border-b border-slate-700 py-2">
                      <span className="text-slate-500 w-32">Terminación</span>
                      <span className="font-medium text-slate-200">{selectedProduct.finish || '-'}</span>
                    </div>
                  </div>

                  <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-800">
                    <h4 className="text-sm font-bold text-white mb-2">Descripción</h4>
                    <p className="text-sm text-slate-400 leading-relaxed max-h-40 overflow-y-auto">
                      {selectedProduct.description || "Sin descripción."}
                    </p>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-700">
                   <button 
                     onClick={() => {
                        const message = encodeURIComponent(`Hola, estoy interesado en el producto: ${selectedProduct.name} (Código: ${selectedProduct.code || '-'})`);
                        window.open(`https://wa.me/56979796666?text=${message}`, '_blank');
                     }}
                     className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white font-bold py-3 px-4 rounded-xl transition-colors shadow-lg shadow-green-500/20 flex items-center justify-center gap-2"
                   >
                     <MessageCircle className="w-5 h-5" />
                     Contactar por WhatsApp
                   </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicView;
