import { Authenticator, Theme, ThemeProvider } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import logoReserlia from '../assets/logo-reserlia.png';

// CSS para ocultar la pestaña de "Sign In" en registro
const registrationStyles = `
  .amplify-tabs [data-value="signIn"] {
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

// Componentes personalizados para el header de registro
const registrationComponents = {
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
          Crear Cuenta
        </h1>
        <p style={{
          color: 'rgb(107, 114, 128)',
          fontSize: '1rem',
          margin: 0
        }}>
          Regístrate para acceder a Reserlia
        </p>
      </div>
    );
  },
  SignIn: {
    Footer() {
      return (
        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <p style={{ color: 'rgb(107, 114, 128)', fontSize: '0.875rem' }}>
            ¿Ya tienes cuenta?{' '}
            <a 
              href="/" 
              style={{ 
                color: 'rgb(0, 201, 167)', 
                textDecoration: 'none',
                fontWeight: 500
              }}
            >
              Inicia sesión aquí
            </a>
          </p>
        </div>
      );
    }
  }
};

function RegistrationContent() {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: 'rgb(249, 250, 251)'
    }}>
      <Authenticator 
        components={registrationComponents}
        initialState="signUp"
        signUpAttributes={[
          'email',
          'given_name',
          'family_name',
          'phone_number',
          'name'
        ]}
        formFields={{
          signUp: {
            given_name: {
              label: 'Nombre *',
              placeholder: 'Introduce tu nombre',
              order: 1
            },
            family_name: {
              label: 'Apellidos *',
              placeholder: 'Introduce tus apellidos',
              order: 2
            },
            email: {
              label: 'Email *',
              placeholder: 'Introduce tu email',
              order: 3
            },
            name: {
              label: 'Nombre del negocio *',
              placeholder: 'Introduce el nombre de tu negocio',
              order: 4
            },
            phone_number: {
              label: 'Número de teléfono *',
              placeholder: '+34 600 000 000',
              dialCode: '+34',
              order: 5
            },
            password: {
              label: 'Contraseña *',
              placeholder: 'Introduce tu contraseña',
              order: 6
            },
            confirm_password: {
              label: 'Confirmar contraseña *',
              placeholder: 'Confirma tu contraseña',
              order: 7
            }
          }
        }}
      >
        {({ user }) => {
          // Redirect to login page after successful registration
          if (user) {
            window.location.href = '/';
          }
          return <div>Redirigiendo...</div>;
        }}
      </Authenticator>
    </div>
  );
}

export default function RegistrationScreen() {
  return (
    <>
      <style>{registrationStyles}</style>
      <ThemeProvider theme={reserliaAuthTheme}>
        <RegistrationContent />
      </ThemeProvider>
    </>
  );
}
