import { Authenticator, Theme, ThemeProvider } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import App from "../App.tsx";
import { ToastContainer } from 'react-toastify';
import logoReserlia from '../assets/logo-reserlia.png';

// CSS para ocultar la pestaña de "Create Account" en login
const loginStyles = `
  .amplify-tabs [data-value="signUp"] {
    display: none !important;
  }
  .amplify-tabs [role="tablist"] {
    display: none !important;
  }
  .amplify-authenticator__modal {
    width: 100%;
    max-width: 400px;
  }
`;

// Tema personalizado para el Authenticator de Reserlia
const reserliaAuthTheme: Theme = {
  name: 'reserlia-auth-theme',
  tokens: {
    colors: {
      brand: {
        primary: {
          10: 'rgb(240, 253, 250)',
          20: 'rgb(204, 251, 241)',
          40: 'rgb(110, 231, 183)',
          60: 'rgb(52, 211, 153)',
          80: 'rgb(0, 201, 167)',
          90: 'rgb(0, 161, 134)',
          100: 'rgb(0, 120, 100)'
        }
      },
      background: {
        primary: 'white',
        secondary: 'rgb(249, 250, 251)'
      }
    },
    components: {
      authenticator: {
        router: {
          boxShadow: '0 0 16px rgba(0, 201, 167, 0.12)'
        }
      },
      button: {
        primary: {
          backgroundColor: 'rgb(0, 201, 167)',
          _hover: {
            backgroundColor: 'rgb(0, 161, 134)'
          },
          _focus: {
            backgroundColor: 'rgb(0, 161, 134)'
          }
        }
      },
      fieldcontrol: {
        _focus: {
          borderColor: 'rgb(0, 201, 167)'
        }
      }
    }
  }
};

// Componentes personalizados para el header de login
const loginComponents = {
  Header() {
    return (
      <div style={{
        textAlign: 'center',
        padding: '2rem 0 1rem 0'
      }}>
        <img 
          src={logoReserlia} 
          alt="Reserlia" 
          style={{ 
            height: '60px', 
            width: 'auto',
            marginBottom: '1rem'
          }} 
        />
        <h1 style={{
          color: 'rgb(31, 41, 55)',
          fontSize: '1.875rem',
          fontWeight: 600,
          margin: '0 0 0.5rem 0'
        }}>
          Reserlia
        </h1>
        <p style={{
          color: 'rgb(107, 114, 128)',
          fontSize: '1rem',
          margin: 0
        }}>
          Gestión de Reservas - Backoffice
        </p>
      </div>
    );
  },
  SignIn: {
    Footer() {
      return (
        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <p style={{ color: 'rgb(107, 114, 128)', fontSize: '0.875rem' }}>
            ¿No tienes cuenta?{' '}
            <a 
              href="/checkout" 
              style={{ 
                color: 'rgb(0, 201, 167)', 
                textDecoration: 'none',
                fontWeight: 500
              }}
            >
              Regístrate aquí
            </a>
          </p>
        </div>
      );
    }
  }
};

export default function LoginScreen() {
  return (
    <>
      <style>{loginStyles}</style>
      <ThemeProvider theme={reserliaAuthTheme}>
        <Authenticator 
          components={loginComponents}
          initialState="signIn"
        >
          <App />
          <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
        </Authenticator>
      </ThemeProvider>
    </>
  );
}
