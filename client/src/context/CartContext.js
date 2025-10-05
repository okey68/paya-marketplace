import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState([]);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (error) {
        console.error('Failed to parse cart from localStorage:', error);
      }
    }
  }, []);

  // Save cart to localStorage whenever items change
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
  }, [items]);

  const addItem = (product, quantity = 1) => {
    setItems(currentItems => {
      const existingItem = currentItems.find(item => item.product._id === product._id);
      
      if (existingItem) {
        return currentItems.map(item =>
          item.product._id === product._id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      
      return [...currentItems, { product, quantity }];
    });
  };

  // Simplified addToCart function for easier use
  const addToCart = (item) => {
    setItems(currentItems => {
      const existingItem = currentItems.find(cartItem => cartItem.id === item.id);
      
      if (existingItem) {
        return currentItems.map(cartItem =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      }
      
      return [...currentItems, { ...item, quantity: 1 }];
    });
  };

  const removeItem = (productId) => {
    setItems(currentItems => currentItems.filter(item => 
      (item.product?._id || item.id) !== productId
    ));
  };

  const removeFromCart = (itemId) => {
    setItems(currentItems => currentItems.filter(item => item.id !== itemId));
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    setItems(currentItems =>
      currentItems.map(item => {
        const itemId = item.product?._id || item.id;
        return itemId === productId ? { ...item, quantity } : item;
      })
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const getItemCount = () => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  const getSubtotal = () => {
    return items.reduce((total, item) => {
      const price = item.product?.price || item.price || 0;
      return total + (price * item.quantity);
    }, 0);
  };

  const getTotal = () => {
    return getSubtotal();
  };

  const getTotalTax = () => {
    return items.reduce((total, item) => {
      const price = item.product?.price || item.price || 0;
      const itemSubtotal = price * item.quantity;
      const taxRate = item.product?.taxRate || item.taxRate || 0;
      return total + (itemSubtotal * taxRate);
    }, 0);
  };

  const getTotalShipping = () => {
    return items.reduce((total, item) => {
      const shippingCost = item.product?.shippingCost || item.shippingCost || 0;
      return total + (shippingCost * item.quantity);
    }, 0);
  };

  const value = {
    items,
    addItem,
    addToCart,
    removeItem,
    removeFromCart,
    updateQuantity,
    clearCart,
    getItemCount,
    getSubtotal,
    getTotalTax,
    getTotalShipping,
    getTotal
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};
