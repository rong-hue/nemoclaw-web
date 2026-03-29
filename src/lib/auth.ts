// 简化的认证系统（使用 localStorage）
export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export const authService = {
  login: (email: string, password: string): User | null => {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find((u: User & { password: string }) => 
      u.email === email && u.password === password
    );
    
    if (user) {
      localStorage.setItem('currentUser', JSON.stringify(user));
      return user;
    }
    return null;
  },

  register: (email: string, password: string, name: string): User => {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    const newUser: User & { password: string } = {
      id: Date.now().toString(),
      email,
      name,
      password,
      createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem('currentUser', JSON.stringify(newUser));
    
    return newUser;
  },

  logout: () => {
    localStorage.removeItem('currentUser');
  },

  getCurrentUser: (): User | null => {
    const user = localStorage.getItem('currentUser');
    return user ? JSON.parse(user) : null;
  }
};
