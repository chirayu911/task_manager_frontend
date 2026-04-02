import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { ChakraProvider, ColorModeScript } from '@chakra-ui/react';
import { generateTheme, THEME_PRESETS } from '../theme';

const ThemeContext = createContext();

export const useThemeManager = () => useContext(ThemeContext);

export const ThemeLoader = ({ children }) => {
  const [themeColor, setThemeColor] = useState('indigo');

  // Check local storage immediately to prevent flashing unbranded theme on reload
  useEffect(() => {
    const saved = localStorage.getItem('companyThemeColor');
    if (saved && THEME_PRESETS[saved]) {
      setThemeColor(saved);
    }
  }, []);

  // Sync to local storage for persistence across reloads before Auth resolves
  useEffect(() => {
    localStorage.setItem('companyThemeColor', themeColor);
  }, [themeColor]);

  // Generate the Chakra theme object based on the current active preset
  const activeTheme = useMemo(() => generateTheme(themeColor), [themeColor]);

  return (
    <ThemeContext.Provider value={{ themeColor, setThemeColor, THEME_PRESETS }}>
      <ChakraProvider theme={activeTheme}>
        <ColorModeScript initialColorMode={activeTheme.config.initialColorMode} />
        {children}
      </ChakraProvider>
    </ThemeContext.Provider>
  );
};
