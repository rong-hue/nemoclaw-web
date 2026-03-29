// 购物车管理
export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export const cartService = {
  getCart: (): CartItem[] => {
    const cart = localStorage.getItem('cart');
    return cart ? JSON.parse(cart) : [];
  },

  addItem: (item: Omit<CartItem, 'quantity'>) => {
    const cart = cartService.getCart();
    const existing = cart.find(i => i.id === item.id);
    
    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({ ...item, quantity: 1 });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
  },

  updateQuantity: (id: string, quantity: number) => {
    const cart = cartService.getCart();
    const item = cart.find(i => i.id === id);
    if (item) {
      item.quantity = Math.max(1, quantity);
      localStorage.setItem('cart', JSON.stringify(cart));
    }
  },

  removeItem: (id: string) => {
    const cart = cartService.getCart().filter(i => i.id !== id);
    localStorage.setItem('cart', JSON.stringify(cart));
  },

  clearCart: () => {
    localStorage.removeItem('cart');
  },

  getTotal: (): number => {
    return cartService.getCart().reduce((sum, item) => sum + item.price * item.quantity, 0);
  }
};
