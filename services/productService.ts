
import { Product } from '../types';

// *** IMPORTANT: PASTE YOUR GOOGLE APPS SCRIPT URL HERE ***
// If you set this URL, the app will never ask for it again.
export const HARDCODED_SCRIPT_URL: string = ""; 

// Helper to get the API URL (Prioritizes hardcoded URL, then localStorage)
export const getApiUrl = () => {
  if (HARDCODED_SCRIPT_URL && HARDCODED_SCRIPT_URL.trim() !== "") {
    return HARDCODED_SCRIPT_URL;
  }
  return localStorage.getItem('floor_depot_sheet_url');
};

export const isApiConfigured = () => {
  return !!getApiUrl();
};

// Helper to generate a UUID for new products
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const fetchProducts = async (): Promise<Product[]> => {
  const url = getApiUrl();
  if (!url) return [];

  try {
    // Force timestamp to bypass cache
    const fetchUrl = `${url}?action=read&t=${Date.now()}`;
    const response = await fetch(fetchUrl);
    
    if (!response.ok) throw new Error('Error de red al conectar con Google Sheets');
    
    const json = await response.json();
    if (json.status === 'error') throw new Error(json.message);
    
    if (!json.data || !Array.isArray(json.data)) return [];

    return json.data.map((item: any) => {
      // NOTE: Script v13 returns keys in LOWERCASE to avoid case sensitivity issues.
      
      const rawFeatured = item.isfeatured !== undefined ? item.isfeatured : item.isFeatured;
      let isFeatured = false;
      
      // Check all possible truthy variations coming from Google Sheets
      if (rawFeatured === true) isFeatured = true;
      else if (typeof rawFeatured === 'string') {
        const clean = rawFeatured.trim().toUpperCase();
        isFeatured = clean === 'TRUE' || clean === 'VERDADERO' || clean === 'SI';
      } else if (rawFeatured === 1) {
        isFeatured = true;
      }

      // Map fields using lowercase keys primarily
      return {
        id: String(item.id || '').trim(), 
        name: String(item.name || ''),
        category: String(item.category || ''),
        format: String(item.format || ''),
        yield: Number(item.yield) || 0,
        price: Number(item.price) || 0,
        finish: String(item.finish || ''),
        code: String(item.code || ''),
        description: String(item.description || ''),
        images: Array.isArray(item.images) 
          ? item.images 
          : (item.images ? String(item.images).split(',') : []),
        cost: Number(item.cost) || 0,
        provider: String(item.provider || ''),
        createdAt: item.createdat || item.createdAt, // Handle both cases
        isFeatured: isFeatured
      };
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
};

const sendToSheet = async (payload: any) => {
  const url = getApiUrl();
  if (!url) throw new Error("URL de API no configurada");

  try {
    // CRITICAL FIX: Use 'text/plain' to avoid CORS Preflight (OPTIONS) check
    // which fails on Apps Script. The script parses the body regardless of header.
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload)
    });

    const json = await response.json();
    if (json.status === 'error') {
      throw new Error(json.message || "Error desconocido en el script");
    }
    return json;
  } catch (error) {
    console.error("Error sending to sheet:", error);
    throw error;
  }
};

export const addProduct = async (product: Product) => {
  const newProduct = { ...product, id: generateId() };
  await sendToSheet({
    action: 'create',
    data: {
      ...newProduct,
      images: newProduct.images.join(','),
      // Explicit string "TRUE" or "FALSE"
      isFeatured: newProduct.isFeatured ? "TRUE" : "FALSE"
    }
  });
};

export const updateProduct = async (id: string, product: Product) => {
  await sendToSheet({
    action: 'update',
    id: String(id).trim(),
    data: {
      ...product,
      images: product.images.join(','),
      isFeatured: product.isFeatured ? "TRUE" : "FALSE"
    }
  });
};

export const deleteProduct = async (id: string) => {
  const cleanId = String(id).trim();
  if(!cleanId) throw new Error("ID inválido para eliminar");
  
  await sendToSheet({
    action: 'delete',
    id: cleanId
  });
};
