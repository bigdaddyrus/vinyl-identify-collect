import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { CapturedImage, ScanCart } from '@/types';

const INITIAL_CART: ScanCart = {
  images: [],
  currentStep: 'barcode',
};

interface ScanCartContextValue {
  cart: ScanCart;
  addImage: (img: CapturedImage) => void;
  removeImage: (type: CapturedImage['type']) => void;
  setBarcode: (code: string) => void;
  skipBarcode: () => void;
  rescanBarcode: () => void;
  resetCart: () => void;
}

const ScanCartContext = createContext<ScanCartContextValue | null>(null);

const TYPE_ORDER: CapturedImage['type'][] = ['front', 'back', 'label'];

function sortByType(images: CapturedImage[]): CapturedImage[] {
  return [...images].sort(
    (a, b) => TYPE_ORDER.indexOf(a.type) - TYPE_ORDER.indexOf(b.type)
  );
}

function getNextStep(images: CapturedImage[]): ScanCart['currentStep'] {
  const types = new Set(images.map((img) => img.type));
  if (!types.has('front')) return 'front';
  if (!types.has('back')) return 'back';
  return 'ready';
}

export function ScanCartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<ScanCart>(INITIAL_CART);

  const addImage = useCallback((img: CapturedImage) => {
    setCart((prev) => {
      // Replace if same type already exists, then normalize to deterministic order
      const filtered = prev.images.filter((existing) => existing.type !== img.type);
      const next = sortByType([...filtered, img]);
      return { images: next, currentStep: getNextStep(next) };
    });
  }, []);

  const removeImage = useCallback((type: CapturedImage['type']) => {
    setCart((prev) => {
      const next = sortByType(prev.images.filter((img) => img.type !== type));
      return { images: next, currentStep: getNextStep(next) };
    });
  }, []);

  const setBarcode = useCallback((code: string) => {
    setCart((prev) => ({ ...prev, barcode: code, currentStep: 'front' }));
  }, []);

  const skipBarcode = useCallback(() => {
    setCart((prev) => ({ ...prev, currentStep: 'front' }));
  }, []);

  const rescanBarcode = useCallback(() => {
    setCart((prev) => ({ ...prev, barcode: undefined, currentStep: 'barcode' }));
  }, []);

  const resetCart = useCallback(() => {
    setCart(INITIAL_CART);
  }, []);

  return (
    <ScanCartContext.Provider value={{ cart, addImage, removeImage, setBarcode, skipBarcode, rescanBarcode, resetCart }}>
      {children}
    </ScanCartContext.Provider>
  );
}

export function useScanCart(): ScanCartContextValue {
  const ctx = useContext(ScanCartContext);
  if (!ctx) {
    throw new Error('useScanCart must be used within a ScanCartProvider');
  }
  return ctx;
}
