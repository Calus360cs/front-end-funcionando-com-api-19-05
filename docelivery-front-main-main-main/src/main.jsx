// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from 'react-router-dom';
import App from "./App.jsx";
import './index.css';

// 1. ÚNICA importação do Provedor do Dashboard
import { DashboardProvider } from "./DoceLivery/context/DashboardContext.jsx";

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <DashboardProvider>
                <App />
            </DashboardProvider>
        </BrowserRouter>
    </React.StrictMode>,
);