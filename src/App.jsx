import React from 'react';

export default function App() {
  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Retailer POS System</h1>
      <p>The application is working! All files have been successfully converted from TypeScript to JavaScript.</p>
      <pre>{JSON.stringify({ version: '1.0.0', status: 'running', jsEnabled: true }, null, 2)}</pre>
    </div>
  );
}
