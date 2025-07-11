import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('dark'); // 默认深色模式

  // 从localStorage加载主题设置
  useEffect(() => {
    const savedTheme = localStorage.getItem('mypage-theme');
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  // 保存主题设置并更新CSS变量
  useEffect(() => {
    localStorage.setItem('mypage-theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    
    // 更新CSS自定义属性
    if (theme === 'dark') {
      document.documentElement.style.setProperty('--bg-primary', '#0a0a0a');
      document.documentElement.style.setProperty('--bg-secondary', '#1a1a2e');
      document.documentElement.style.setProperty('--bg-card', 'rgba(255, 255, 255, 0.05)');
      document.documentElement.style.setProperty('--text-primary', '#ffffff');
      document.documentElement.style.setProperty('--text-secondary', 'rgba(255, 255, 255, 0.7)');
      document.documentElement.style.setProperty('--border-color', 'rgba(255, 255, 255, 0.1)');
      document.documentElement.style.setProperty('--shadow', '0 8px 30px rgba(0, 0, 0, 0.3)');
    } else {
      document.documentElement.style.setProperty('--bg-primary', '#ffffff');
      document.documentElement.style.setProperty('--bg-secondary', '#f8fafc');
      document.documentElement.style.setProperty('--bg-card', '#ffffff');
      document.documentElement.style.setProperty('--text-primary', '#2d3748');
      document.documentElement.style.setProperty('--text-secondary', '#666666');
      document.documentElement.style.setProperty('--border-color', '#e2e8f0');
      document.documentElement.style.setProperty('--shadow', '0 8px 30px rgba(0, 0, 0, 0.12)');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const value = {
    theme,
    toggleTheme,
    isDark: theme === 'dark'
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};