
export enum ProductCategory {
  CERAMICA_PISO = 'Cerámicas de Piso',
  CERAMICA_MURO = 'Cerámicas de Muro',
  PORCELANATO = 'Porcelanatos',
  PISO_FLOTANTE = 'Pisos Flotantes',
  PISO_VINILICO = 'Pisos Vinílicos SPC'
}

export interface Product {
  id?: string;
  name: string;
  category: ProductCategory | string;
  format: string;
  yield: number; // m2 per box
  price: number;
  finish: string;
  code?: string;
  description: string;
  images: string[];
  // Private fields
  cost: number;
  provider: string;
  createdAt?: any;
  // New field
  isFeatured?: boolean;
}

export const INITIAL_PRODUCT_STATE: Product = {
  name: '',
  category: ProductCategory.PORCELANATO,
  format: '',
  yield: 0,
  price: 0,
  finish: '',
  code: '',
  description: '',
  images: [],
  cost: 0,
  provider: '',
  isFeatured: false
};
