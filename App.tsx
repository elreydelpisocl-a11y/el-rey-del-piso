
import React, { useState, useEffect, useCallback } from 'react';
import { Product } from './types';
import AdminView from './components/AdminView';
import PublicView from './components/PublicView';
import SheetConfig from './components/SheetConfig';
import { fetchProducts, isApiConfigured } from './services/productService';
import { LayoutGrid, Box, Lock, ExternalLink } from 'lucide-react';

const App: React.FC = () => {
  // CHANGED: Default is now FALSE (Public Catalog)
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isConfigured, setIsConfigured] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Check configuration on load
  useEffect(() => {
    // We now check the centralized service, which checks both Hardcoded URL and LocalStorage
    if (isApiConfigured()) {
      setIsConfigured(true);
    } else {
      setLoading(false);
    }
  }, []);

  // loadData definition: Stable reference, handles both background and foreground loads
  const loadData = useCallback(async (isBackground: boolean = false) => {
    if (!isApiConfigured()) return;
    
    // Only show spinner if it's NOT a background sync
    if (!isBackground) setLoading(true);
    
    try {
      const data = await fetchProducts();
      // Sort: Newest first (based on id/creation if available)
      setProducts([...data].reverse()); 
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Failed to load products", error);
    } finally {
      // Only hide spinner if we showed it
      if (!isBackground) setLoading(false);
    }
  }, []);

  // Initial Load & Polling Effect
  useEffect(() => {
    if (isConfigured) {
      // 1. Initial Load (with spinner)
      loadData(false);
      
      // 2. Setup Background Polling (silent)
      const interval = setInterval(() => {
        loadData(true);
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [isConfigured, loadData]);

  const handleConfigSave = () => {
    setIsConfigured(true);
    // useEffect will trigger the initial load
  };

  const handleManualRefresh = () => {
    loadData(false); // Trigger load with spinner
  };

  if (!isConfigured) {
    return <SheetConfig onSave={handleConfigSave} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-slate-800 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary text-white p-1.5 rounded-lg">
              <Box className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-gray-900 leading-none">FLOOR DEPOT</h1>
              <span className="text-[10px] uppercase font-semibold text-gray-500 tracking-widest">
                {isAdminMode ? 'Administración' : 'Catálogo Digital'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
             {isAdminMode && (
              <>
                <a 
                  href="https://floordepot.cl" 
                  target="_blank" 
                  rel="noreferrer"
                  className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-primary transition-colors px-3 py-1.5 rounded-md hover:bg-gray-50"
                >
                  Ir a Web Principal
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                
                <button
                  onClick={() => setIsAdminMode(false)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-900 text-white text-xs font-bold hover:bg-gray-800 transition-all shadow-md active:transform active:scale-95"
                >
                  <LayoutGrid className="w-4 h-4" />
                  Ver Catálogo Web
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading && products.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 space-y-4">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm text-gray-500 animate-pulse">Cargando inventario desde Google Sheets...</p>
          </div>
        ) : (
          <>
            {isAdminMode ? (
              <AdminView products={products} onProductUpdate={handleManualRefresh} />
            ) : (
              <PublicView products={products} />
            )}
          </>
        )}
      </main>
      
      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-400">
          <p>© {new Date().getFullYear()} Floor Depot Management System.</p>
          <div className="flex items-center gap-2">
            <p>Conectado a Google Sheets • Última act: {lastUpdated.toLocaleTimeString()}</p>
            
            {/* DISCREET ADMIN BUTTON */}
            {!isAdminMode && (
                <button 
                    onClick={() => setIsAdminMode(true)} 
                    className="p-2 hover:text-primary hover:bg-gray-100 rounded-full transition-colors ml-2 opacity-30 hover:opacity-100"
                    title="Acceso Administración"
                >
                    <Lock className="w-3 h-3" />
                </button>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
