import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';

type ThemeType = 'light' | 'dark';

interface ThemeContextData {
  theme: ThemeType;
  toggleTheme: () => void;
  colors: {
    background: string;
    card: string;
    text: string;
    textSecondary: string;
    accent: string;
    border: string;
    success: string;
    danger: string;
    chartLine: string;
  };
}

const lightColors = {
  background: '#F9FAFB', // Un gris muy claro/blanco roto
  card: '#FFFFFF',
  text: '#111827',
  textSecondary: '#6B7280',
  accent: '#EF4444', // Rojo como en el diseño, o el verde de antes. En la imagen domina el rojo y detalles verdes.
  border: '#E5E7EB',
  success: '#10B981',
  danger: '#EF4444',
  chartLine: '#EF4444' // Línea roja para las gráficas
};

const darkColors = {
  background: '#131418',
  card: '#1F2025', // Un poco más claro que el fondo para las tarjetas
  text: '#FFFFFF',
  textSecondary: '#9CA3AF',
  accent: '#3B82F6', 
  border: 'rgba(255,255,255,0.05)',
  success: '#10B981',
  danger: '#EF4444',
  chartLine: '#3B82F6'
};

const ThemeContext = createContext<ThemeContextData>({} as ThemeContextData);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const systemTheme = useColorScheme();
  const [theme, setTheme] = useState<ThemeType>(systemTheme === 'dark' ? 'dark' : 'light');

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const colors = theme === 'light' ? lightColors : darkColors;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
