import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';
import './figma-visible-layers.css';

const rootElement = document.getElementById('root');

if (!rootElement) throw new Error('アプリケーションの表示先が見つかりません。');

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
