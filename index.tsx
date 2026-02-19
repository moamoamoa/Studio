import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

console.log("Starting App mount sequence...");

const rootElement = document.getElementById('root');
if (!rootElement) {
  const msg = "Could not find root element to mount to";
  console.error(msg);
  throw new Error(msg);
}

try {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  console.log("App mounted successfully");
} catch (error) {
  console.error("Error mounting app:", error);
  // Re-throw to trigger global error handler
  throw error;
}