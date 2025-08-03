import { createTheme } from '@mui/material/styles';

// Tema personalizado de Reserlia basado en su web
export const reserliaTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: 'rgb(0, 201, 167)', // Color principal de Reserlia
      light: 'rgb(26, 221, 187)',
      dark: 'rgb(0, 161, 134)',
    },
    secondary: {
      main: '#6b7280', // Gris para contraste
      light: '#9ca3af',
      dark: '#4b5563',
    },
    background: {
      default: '#ffffff', // Fondo blanco principal
      paper: '#ffffff', // Fondo blanco para la tabla
    },
    text: {
      primary: '#1f2937', // Texto oscuro sobre fondo blanco
      secondary: '#6b7280', // Texto gris para contraste
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
      color: '#1f2937',
    },
    h6: {
      fontWeight: 500,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 500,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
  },
});
