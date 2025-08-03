import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import "./index.css";
import { Amplify } from "aws-amplify";
import outputs from "../amplify_outputs.json";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

Amplify.configure(outputs);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Authenticator>
      <App />
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
    </Authenticator>
  </React.StrictMode>
);
