import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import "./index.css";
import { Amplify } from "aws-amplify";
import outputs from "../amplify_outputs.json";
import LoginScreen from './components/LoginScreen';
import RegistrationScreen from './components/RegistrationScreen';

Amplify.configure(outputs);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginScreen />} />
        <Route path="/checkout" element={<RegistrationScreen />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
