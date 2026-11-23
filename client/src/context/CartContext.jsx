import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from './ToastContext';

const CartContext = createContext(null);

// Add to Cart Rate Limit Cooldown (5 seconds)
const ADD_TO_CART_COOLDOWN_MS = 5000;

export function CartProvider({ children }) {
  const { warning, success } = useToast();
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem('shopping_cart');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  // Rate limit cooldown state per product: { [productId]: expireTimestamp }
  const [cooldowns, setCooldowns] = useState({});

  useEffect(() => {
    try {
      localStorage.setItem('shopping_cart', JSON.stringify(cartItems));
    } catch (e) {
      console.error('Error saving cart:', e);
    }
  }, [cartItems]);

  // Tick interval to keep remaining cooldown seconds accurate across UI
  useEffect(() => {
    const hasActive = Object.values(cooldowns).some((exp) => exp > Date.now());
    if (!hasActive) return;

    const interval = setInterval(() => {
      setCooldowns((prev) => {
        const now = Date.now();
        const next = {};
        let hasAny = false;
        for (const [id, exp] of Object.entries(prev)) {
          if (exp > now) {
            next[id] = exp;
            hasAny = true;
          }
        }
        return hasAny ? next : {};
      });
    }, 500);

    return () => clearInterval(interval);
  }, [cooldowns]);

  // Helper to query remaining cooldown in seconds for a product
  const getCooldown = (productId) => {
    if (!productId) return 0;
    const exp = cooldowns[productId];
    if (!exp) return 0;
    const remaining = Math.ceil((exp - Date.now()) / 1000);
    return remaining > 0 ? remaining : 0;
  };

  const addToCart = (product, quantity = 1) => {
    if (!product || !product.id) return false;

    // 10-Second Rate Limit Check
    const now = Date.now();
    const exp = cooldowns[product.id];
    if (exp && exp > now) {
      const remaining = Math.ceil((exp - now) / 1000);
      warning(`Please wait ${remaining}s before adding "${product.product_name}" again.`);
      return false;
    }

    const qtyToAdd = Math.max(1, parseInt(quantity, 10));
    const effectivePrice = product.discount_price ? product.discount_price : product.price;

    let canAdd = true;
    setCartItems((prevItems) => {
      const existingIndex = prevItems.findIndex((item) => item.id === product.id);

      if (existingIndex > -1) {
        const existingItem = prevItems[existingIndex];
        const newTotalQty = existingItem.quantity + qtyToAdd;

        // Check against stock limit
        if (newTotalQty > product.stock_quantity) {
          warning(
            `Cannot add ${qtyToAdd} more. Only ${product.stock_quantity} available in stock (you already have ${existingItem.quantity} in cart).`
          );
          canAdd = false;
          return prevItems;
        }

        const updated = [...prevItems];
        updated[existingIndex] = {
          ...existingItem,
          quantity: newTotalQty
        };
        success(`Added ${qtyToAdd} more "${product.product_name}" to your cart`);
        return updated;
      } else {
        if (qtyToAdd > product.stock_quantity) {
          warning(`Only ${product.stock_quantity} items available in stock.`);
          canAdd = false;
          return prevItems;
        }

        success(`Added "${product.product_name}" to cart`);
        return [
          ...prevItems,
          {
            id: product.id,
            product_name: product.product_name,
            tamil_name: product.tamil_name,
            price: product.price,
            discount_price: product.discount_price,
            effective_price: effectivePrice,
            quantity: qtyToAdd,
            primary_image: product.primary_image || (product.images?.[0]?.image_url),
            stock_quantity: product.stock_quantity,
            sku: product.sku
          }
        ];
      }
    });

    if (canAdd) {
      // Set 5-second rate limit cooldown for this product
      setCooldowns((prev) => ({
        ...prev,
        [product.id]: Date.now() + ADD_TO_CART_COOLDOWN_MS
      }));
    }

    return canAdd;
  };

  const updateQuantity = (productId, newQty) => {
    const qty = parseInt(newQty, 10);
    if (qty <= 0) {
      removeFromCart(productId);
      return;
    }

    setCartItems((prev) =>
      prev.map((item) => {
        if (item.id === productId) {
          if (qty > item.stock_quantity) {
            warning(`Only ${item.stock_quantity} items available in stock.`);
            return { ...item, quantity: item.stock_quantity };
          }
          return { ...item, quantity: qty };
        }
        return item;
      })
    );
  };

  const removeFromCart = (productId) => {
    setCartItems((prev) => prev.filter((item) => item.id !== productId));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const cartTotalQuantity = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const cartSubtotal = cartItems.reduce(
    (acc, item) => acc + (parseFloat(item.effective_price) * item.quantity),
    0
  );

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        getCooldown,
        cooldowns,
        updateQuantity,
        removeFromCart,
        clearCart,
        cartTotalQuantity,
        cartSubtotal,
        isCartOpen,
        openCart: () => setIsCartOpen(true),
        closeCart: () => setIsCartOpen(false)
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
