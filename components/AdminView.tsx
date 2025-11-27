
import React, { useState, useEffect } from 'react';
import { Product, INITIAL_PRODUCT_STATE, ProductCategory } from '../types';
import { addProduct, updateProduct, deleteProduct } from '../services/productService';
import { convertToDirectImageURL, formatCurrency } from '../utils';
import { Pencil, Trash2, ExternalLink, Save, Plus, Lock, Sheet, Settings, RefreshCw, Star } from 'lucide-react';

interface AdminViewProps {
  products: Product[];
  onProductUpdate: () => void;
}

const AdminView: React.FC<AdminViewProps> = ({ products, onProductUpdate }) => {
  const [formData, setFormData] = useState<Product>(INITIAL_PRODUCT_STATE);
  const [imageInput, setImageInput] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('TODOS');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingId && formData.images) {
      setImageInput(formData.images.join(', '));
    } else if (!editingId) {
      setImageInput('');
    }
  }, [editingId, formData.images]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    let finalValue: any = value;

    if (type === 'number') {
      finalValue = parseFloat(value) || 0;
    } else if (type === 'checkbox') {
        finalValue = (e.target as HTMLInputElement).checked;
    }

    setFormData(prev => ({
      ...prev,
      [name]: finalValue
    }));
  };

  const handleImageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageInput(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!localStorage.getItem('floor_depot_sheet_url')) {
        alert("Error crítico: No hay conexión a base de datos. Configura la URL primero.");
        return;
    }

    setIsSubmitting(true);
    
    const processedImages = imageInput
      .split(',')
      .map(url => url.trim())
      .filter(url => url.length > 0);

    const productToSave = {
      ...formData,
      images: processedImages,
      isFeatured: !!formData.isFeatured
    };

    try {
      if (editingId) {
        await updateProduct(editingId, productToSave);
        setEditingId(null);
      } else {
        await addProduct(productToSave);
      }
      setFormData(INITIAL_PRODUCT_STATE);
      setImageInput('');
      
      onProductUpdate();
      alert("Guardado exitoso en Google Sheets.");
      
    } catch (error: any) {
      console.error(error);
      alert(`Error al guardar: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if(!id) {
        alert("Error: El producto no tiene ID válido.");
        return;
    }
    if(!window.confirm("¿Estás seguro de que deseas eliminar este producto permanentemente de la planilla?")) return;
    
    setIsSubmitting(true);
    try {
      await deleteProduct(id);
      onProductUpdate();
      alert("Producto eliminado.");
    } catch (error: any) {
      alert(`Error al eliminar: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (product: Product) => {
    if (product.id) {
      setEditingId(product.id);
      setFormData(product);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData(INITIAL_PRODUCT_STATE);
    setImageInput('');
  };

  const handleResetConfig = () => {
    if(window.confirm("¿Desconectar base de datos? Tendrás que volver a pegar la URL del script.")) {
        localStorage.removeItem('floor_depot_sheet_url');
        window.location.reload();
    }
  };

  const filteredProducts = filterCategory === 'TODOS' 
    ? products 
    : products.filter(p => p.category === filterCategory);

  return (
    <div className="space-y-8 animate-fade-in bg-slate-900 p-6 rounded-xl min-h-[80vh]">
      <div className="border-b border-slate-700 pb-4 mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Panel de Control</h2>
          <p className="text-slate-400 text-sm">Gestiona el inventario, precios y costos ocultos.</p>
        </div>
        <div className="flex items-center gap-3">
            <button onClick={onProductUpdate} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 transition-colors" title="Forzar Sincronización">
                <RefreshCw className={`w-4 h-4 ${isSubmitting ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={handleResetConfig} className="p-2 hover:bg-slate-800 rounded-full text-slate-500 transition-colors" title="Configurar Base de Datos">
                <Settings className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-900/30 border border-green-500/30 rounded-full">
            <Sheet className="w-4 h-4 text-green-400" />
            <span className="text-xs font-medium text-green-400">Google Sheets Sync</span>
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse ml-1"></div>
            </div>
        </div>
      </div>

      <div className={`bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-700 relative ${isSubmitting ? 'opacity-70 pointer-events-none' : ''}`}>
        {isSubmitting && (
            <div className="absolute inset-0 flex items-center justify-center z-10 bg-slate-900/50 backdrop-blur-[2px] rounded-xl flex-col gap-3">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                <span className="text-white font-bold text-sm bg-black/50 px-3 py-1 rounded-full">Procesando...</span>
            </div>
        )}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            {editingId ? <Pencil className="w-5 h-5 text-secondary" /> : <Plus className="w-5 h-5 text-primary" />}
            {editingId ? 'Editar Producto' : 'Ingreso Rápido de Producto'}
          </h2>
          {editingId && (
            <button onClick={handleCancel} className="text-sm text-slate-400 hover:text-white underline transition-colors">
              Cancelar Edición
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1">Nombre</label>
              <input required name="name" value={formData.name} onChange={handleInputChange} className="w-full text-sm p-2.5 bg-white text-slate-900 border border-slate-200 rounded focus:ring-2 focus:ring-primary focus:outline-none placeholder-slate-400 font-medium" placeholder="Nombre del producto" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Categoría</label>
              <select name="category" value={formData.category} onChange={handleInputChange} className="w-full text-sm p-2.5 bg-white text-slate-900 border border-slate-200 rounded focus:ring-2 focus:ring-primary focus:outline-none">
                {Object.values(ProductCategory).map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Formato</label>
              <input name="format" value={formData.format} onChange={handleInputChange} className="w-full text-sm p-2.5 bg-white text-slate-900 border border-slate-200 rounded" placeholder="ej: 60x60" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Rend. (m²/caja)</label>
              <input type="number" step="0.01" name="yield" value={formData.yield === 0 ? '' : formData.yield} onChange={handleInputChange} className="w-full text-sm p-2.5 bg-white text-slate-900 border border-slate-200 rounded" placeholder="0.00" />
            </div>
            <div>
              <label className="block text-xs font-bold text-primary mb-1">Precio Venta</label>
              <input required type="number" name="price" value={formData.price === 0 ? '' : formData.price} onChange={handleInputChange} className="w-full text-sm p-2.5 bg-white text-slate-900 border-2 border-primary rounded font-bold" placeholder="$ 0" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4 p-4 bg-slate-700/50 rounded border border-slate-600">
            <div className="relative">
              <label className="block text-xs font-medium text-red-400 mb-1 flex items-center gap-1"><Lock className="w-3 h-3"/> Costo (Privado)</label>
              <input type="number" name="cost" value={formData.cost === 0 ? '' : formData.cost} onChange={handleInputChange} className="w-full text-sm p-2.5 bg-white text-slate-900 border border-red-200 rounded" placeholder="$ 0" />
            </div>
            <div className="relative">
              <label className="block text-xs font-medium text-red-400 mb-1 flex items-center gap-1"><Lock className="w-3 h-3"/> Proveedor (Privado)</label>
              <input name="provider" value={formData.provider} onChange={handleInputChange} className="w-full text-sm p-2.5 bg-white text-slate-900 border border-red-200 rounded" placeholder="Proveedor" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Terminación</label>
              <input name="finish" value={formData.finish} onChange={handleInputChange} className="w-full text-sm p-2.5 bg-white text-slate-900 border border-slate-200 rounded" placeholder="ej: Mate, Brillante" />
            </div>
             <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Código (Opcional)</label>
              <input name="code" value={formData.code} onChange={handleInputChange} className="w-full text-sm p-2.5 bg-white text-slate-900 border border-slate-200 rounded" placeholder="SKU-123" />
            </div>
             <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1">Descripción</label>
              <textarea name="description" value={formData.description} onChange={handleInputChange} rows={1} className="w-full text-sm p-2.5 bg-white text-slate-900 border border-slate-200 rounded resize-none" placeholder="Breve descripción..." />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
            <div className="md:col-span-4">
              <label className="block text-xs font-medium text-slate-300 mb-1">URLs de Fotos (Google Drive soportado)</label>
              <input name="images" value={imageInput} onChange={handleImageInputChange} className="w-full text-sm p-2.5 bg-white text-slate-900 border border-slate-200 rounded" placeholder="Pegar enlace de imagen aquí..." />
            </div>
            <div className="md:col-span-1 flex items-center justify-center pb-1">
                <label className="flex items-center space-x-2 cursor-pointer p-2 rounded hover:bg-slate-700/50 border border-slate-600 w-full justify-center group transition-all">
                    <input 
                        type="checkbox" 
                        name="isFeatured" 
                        checked={formData.isFeatured || false} 
                        onChange={handleInputChange} 
                        className="w-4 h-4 text-primary bg-slate-800 border-slate-500 rounded focus:ring-primary"
                    />
                    <span className="text-sm text-yellow-400 font-medium flex items-center gap-1 group-hover:text-yellow-300">
                        <Star className={`w-4 h-4 ${formData.isFeatured ? 'fill-yellow-400' : ''}`} />
                        Destacar
                    </span>
                </label>
            </div>
            <div className="md:col-span-1">
              <button disabled={isSubmitting} type="submit" className={`w-full flex justify-center items-center gap-2 py-2.5 px-4 rounded text-white font-medium shadow-lg hover:shadow-xl transition-all ${editingId ? 'bg-secondary hover:bg-secondary-hover' : 'bg-primary hover:bg-primary-hover'} ${isSubmitting ? 'grayscale' : ''}`}>
                <Save className="w-4 h-4" />
                {editingId ? 'Actualizar' : 'Guardar'}
              </button>
            </div>
          </div>
        </form>
      </div>

      <div className="bg-slate-800 rounded-xl shadow-lg border border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-slate-700 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-800">
          <h3 className="font-bold text-white">Inventario ({filteredProducts.length})</h3>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400">Filtrar por:</span>
            <select 
              value={filterCategory} 
              onChange={(e) => setFilterCategory(e.target.value)}
              className="text-sm border border-slate-600 bg-slate-700 text-white rounded p-1.5 focus:ring-primary focus:outline-none"
            >
              <option value="TODOS">Todas las Categorías</option>
              {Object.values(ProductCategory).map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-300">
            <thead className="text-xs text-slate-400 uppercase bg-slate-900 border-b border-slate-700">
              <tr>
                <th className="px-4 py-3 text-center">Img</th>
                <th className="px-4 py-3">Nombre / Desc.</th>
                <th className="px-4 py-3 text-center">Destacado</th>
                <th className="px-4 py-3">Cat. / Detalles</th>
                <th className="px-4 py-3 text-right text-emerald-400">Venta</th>
                <th className="px-4 py-3 text-right text-red-400 bg-red-900/10"><div className="flex items-center justify-end gap-1"><Lock className="w-3 h-3"/> Costo</div></th>
                <th className="px-4 py-3 text-red-400 bg-red-900/10">Proveedor</th>
                <th className="px-4 py-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                    No hay productos registrados en esta categoría.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-700/50 transition-colors" onClick={() => handleEdit(product)}>
                    <td className="px-4 py-3">
                      <div className="relative w-12 h-12 rounded bg-slate-600 overflow-hidden border border-slate-500 mx-auto">
                        {product.images && product.images.length > 0 ? (
                          <img 
                            src={convertToDirectImageURL(product.images[0])} 
                            alt="preview" 
                            className="w-full h-full object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=IMG' }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs bg-slate-800">N/A</div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 cursor-pointer">
                      <div className="font-semibold text-white flex items-center gap-2">
                        {product.name}
                      </div>
                      <div className="text-xs text-slate-500 font-mono mb-0.5">{product.code || 'Sin Código'}</div>
                      <div className="text-xs text-slate-400 italic truncate max-w-[150px] opacity-70">{product.description || 'Sin descripción'}</div>
                    </td>
                    <td className="px-4 py-3 text-center">
                        <div className="flex justify-center items-center flex-col gap-1">
                            <input 
                                type="checkbox" 
                                checked={!!product.isFeatured} 
                                readOnly 
                                className="w-4 h-4 text-yellow-500 bg-slate-700 border-slate-500 rounded focus:ring-0 cursor-not-allowed opacity-90" 
                            />
                            {!!product.isFeatured && <span className="text-[10px] text-yellow-500 font-bold">SI</span>}
                        </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="inline-block px-2 py-0.5 rounded-full bg-slate-700 text-slate-200 text-[10px] font-semibold mb-1 border border-slate-600">
                        {product.category}
                      </div>
                      <div className="text-xs text-slate-400">
                        {product.format} • {product.yield} m²/cj • {product.finish}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-400">
                      {formatCurrency(product.price)}
                    </td>
                    <td className="px-4 py-3 text-right text-red-400 bg-red-900/5 font-medium">
                      {formatCurrency(product.cost || 0)}
                    </td>
                    <td className="px-4 py-3 text-red-400 bg-red-900/5 text-xs">
                      {product.provider || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={(e) => { e.stopPropagation(); window.open(`https://floordepot.cl/p/${product.code || product.id}`, '_blank'); }}
                          className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-700 rounded transition-colors"
                          title="Ver en Web Real"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleEdit(product); }}
                          className="p-1.5 text-slate-400 hover:text-secondary hover:bg-slate-700 rounded transition-colors"
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); if(product.id) handleDelete(product.id); }}
                          className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminView;
