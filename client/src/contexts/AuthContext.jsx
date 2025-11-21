import React, { createContext, useContext, useState, useEffect } from 'react';
import { setRTKGlobalLogout, useLazyGetUserProfileQuery } from '../redux/services/foodCoreAPI.js';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [getUserProfile] = useLazyGetUserProfileQuery();

  useEffect(() => {
    // 檢查 URL 中的 Google Auth 回調參數
    checkAuthCallback();
    
    // 檢查是否有保存的 token
    if (token) {
      validateToken();
    } else {
      setLoading(false);
    }
  }, [token]); // 添加 token 依賴

  // 檢查 Google Auth 回調
  const checkAuthCallback = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const callbackToken = urlParams.get('token');
    const userParam = urlParams.get('user');
    const errorParam = urlParams.get('error');

    if (callbackToken && userParam) {
      try {
        const userData = JSON.parse(decodeURIComponent(userParam));
        login(userData, callbackToken);
        
        // 清除 URL 參數
        window.history.replaceState({}, document.title, window.location.pathname);
        
        console.log('Google 認證成功:', userData);
      } catch (error) {
        console.error('處理 Google 認證回調失敗:', error);
        setLoading(false);
      }
    } else if (errorParam) {
      console.error('Google 認證失敗:', decodeURIComponent(errorParam));
      // 清除 URL 參數
      window.history.replaceState({}, document.title, window.location.pathname);
      setLoading(false);
    }
  };

  const validateToken = async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const { data } = await getUserProfile();
      console.log('Token 驗證響應狀態:', data);

      if (data?.success) {
        const userData = data?.data?.user;
        console.log('Token 驗證成功:', userData);
        setUser(userData);
      } else {
        console.log('Token 無效，清除登入狀態');
        logout();
      }
    } catch (error) {
      console.error('Token validation error:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = (userData, authToken) => {
    console.log('執行登入:', userData);
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('token', authToken);
    setLoading(false);
  };

  const logout = () => {
    console.log('執行登出');
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    setLoading(false);
  };

  // 設置全局登出函數
  useEffect(() => {
    setRTKGlobalLogout(logout);
  }, []);

  const value = {
    user,
    token,
    login,
    logout,
    loading,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};