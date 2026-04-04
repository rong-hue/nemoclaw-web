// 简化的认证系统（使用 localStorage）
export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

// 安全访问 localStorage（Edge Runtime 服务端无 localStorage）
const safeLocalStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(key);
  },
  setItem: (key: string, value: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key, value);
  },
  removeItem: (key: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(key);
  },
};

export const authService = {
  login: (email: string, password: string): User | null => {
    const users = JSON.parse(safeLocalStorage.getItem('users') || '[]');
    const user = users.find((u: User & { password: string }) =>
      u.email === email && u.password === password
    );
    if (user) {
      safeLocalStorage.setItem('currentUser', JSON.stringify(user));
      return user;
    }
    return null;
  },

  register: (email: string, password: string, name: string): User => {
    const users = JSON.parse(safeLocalStorage.getItem('users') || '[]');
    const newUser: User & { password: string } = {
      id: Date.now().toString(),
      email,
      name,
      password,
      createdAt: new Date().toISOString(),
    };
    users.push(newUser);
    safeLocalStorage.setItem('users', JSON.stringify(users));
    safeLocalStorage.setItem('currentUser', JSON.stringify(newUser));
    return newUser;
  },

  logout: () => {
    safeLocalStorage.removeItem('currentUser');
  },

  getCurrentUser: (): User | null => {
    const user = safeLocalStorage.getItem('currentUser');
    return user ? JSON.parse(user) : null;
  },
};
