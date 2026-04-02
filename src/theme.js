import { extendTheme, theme as chakraTheme } from '@chakra-ui/react';

const config = {
  initialColorMode: 'system',
  useSystemColorMode: true,
};

// Define our default indigo fallback explicitly
const indigo = {
  50: '#eeeeff',
  100: '#e6e0ff',
  200: '#d3c7fe',
  300: '#b6a5fc',
  400: '#9381f8',
  500: '#6f63f1ff', // primary color
  600: '#6946e5',
  700: '#4b38ca',
  800: '#4530a3',
  900: '#462e81',
};

// Map intuitive names to Chakra standard palettes, plus our custom indigo
export const THEME_PRESETS = {
  indigo: indigo,                     // Custom default
  blue: chakraTheme.colors.blue,      // Chakra built-in
  green: chakraTheme.colors.green,
  red: chakraTheme.colors.red,
  pink: chakraTheme.colors.pink,
  orange: chakraTheme.colors.orange,
  teal: chakraTheme.colors.teal,
  cyan: chakraTheme.colors.cyan,
  purple: chakraTheme.colors.purple,
  gray: chakraTheme.colors.gray, 
};

// Helper function to generate a full theme object on the fly
export const generateTheme = (colorName = 'indigo') => {
  // Fallback to indigo if the requested colorName doesn't exist
  const brandPalette = THEME_PRESETS[colorName] || THEME_PRESETS.indigo;

  return extendTheme({
    config,
    colors: {
      brand: brandPalette,
    },
    styles: {
      global: (props) => ({
        body: {
          bg: props.colorMode === 'dark' ? 'gray.900' : 'gray.50',
          color: props.colorMode === 'dark' ? 'whiteAlpha.900' : 'gray.800',
        },
      }),
    },
  });
};

// By default, just export the indigo theme so initial boots don't break
export default generateTheme('indigo');
