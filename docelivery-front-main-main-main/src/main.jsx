// src/main.jsx

import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from 'react-router-dom'; // <--- Adicione esta linha
import App from "./App.jsx";
import './index.css';


// ------------------------------------------------------------------
// CORREÇÃO APLICADA AQUI:
// O caminho agora começa com './' (a pasta atual, 'src/') e segue para as subpastas.
// Assumindo que o Contexto está em src/DoceLivery/context/
import { CartProviderStore } from "./DoceLivery/context/CartProviderStore.jsx";
// ------------------------------------------------------------------


ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        {/* Agora o componente CartProviderStore deve ser encontrado corretamente */}
       <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
  <App />
</BrowserRouter>
    </React.StrictMode>,
);