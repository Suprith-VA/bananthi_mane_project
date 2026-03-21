import { createContext, useContext, useState, useCallback } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [userInfo, setUserInfo] = useState(() => {
    try {
      const raw = localStorage.getItem('userInfo');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const login = useCallback((data) => {
    localStorage.setItem('userInfo', JSON.stringify(data));
    setUserInfo(data);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('userInfo');
    setUserInfo(null);
  }, []);

  const isAdmin =
    userInfo?.isAdmin ||
    userInfo?.role === 'admin' ||
    userInfo?.role === 'super-admin';

  return (
    <AuthContext.Provider value={{ userInfo, login, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
