import React from 'react';

export default function App() {
  console.log('[v0] App component rendering - test version');
  
  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Retailer POS System</h1>
      <p>This is a test. The app is loading!</p>
      <pre>{JSON.stringify({ version: '1.0.0', status: 'working' }, null, 2)}</pre>
    </div>
  );
}
