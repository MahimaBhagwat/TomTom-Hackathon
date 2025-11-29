import { configureFonts, DefaultTheme } from 'react-native-paper';
import { Platform } from 'react-native';

const fontConfig = {
  default: {
    regular: {
      fontFamily: 'System',
      fontWeight: '400',
    },
    medium: {
      fontFamily: 'System',
      fontWeight: '500',
    },
    light: {
      fontFamily: 'System',
      fontWeight: '300',
    },
    thin: {
      fontFamily: 'System',
      fontWeight: '100',
    },
  },
};

export const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#6200ee',
    accent: '#03dac4',
    background: '#f6f6f6',
    surface: '#ffffff',
    error: '#B00020',
    text: '#000000',
    onBackground: '#000000',
    onSurface: '#000000',
    disabled: 'rgba(0, 0, 0, 0.26)',
    placeholder: 'rgba(0, 0, 0, 0.54)',
    backdrop: 'rgba(0, 0, 0, 0.5)',
    notification: '#f50057',
  },
  fonts: configureFonts(fontConfig as any),
  roundness: 4,
  animation: {
    scale: 1.0,
  },
};

export type AppTheme = typeof theme;

declare global {
  namespace ReactNativePaper {
    interface ThemeColors {
      // Add custom colors here if needed
    }
    
    interface Theme {
      // Add custom theme properties here if needed
    }
  }
}
