import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/tokens.css';
import { LangProvider } from './i18n.jsx';
import App from './components/App.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <LangProvider>
      <App />
    </LangProvider>
  </React.StrictMode>
);
