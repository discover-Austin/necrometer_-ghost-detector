// Environment configuration for Necrometer
// This file should be loaded before the main app

(function() {
  // Define your environment configuration here
  window.__env = window.__env || {};
  
  // Set to true for production builds
  window.__env.production = false;
  
  // Option 1: Use proxy server (recommended for production)
  // Set useProxy to true and provide your proxy server URL and issuance token
  window.__env.useProxy = true;
  window.__env.proxyUrl = 'https://your-proxy-server.com'; // Change this to your deployed proxy server URL
  window.__env.issuanceToken = 'your_shared_issuance_token'; // Must match the server's SHARED_ISSUANCE_TOKEN
  
  // Option 2: Direct API key (NOT recommended for production - only for testing)
  // If you want to use a direct API key instead of proxy, set useProxy to false
  // and uncomment the line below with your API key
  // window.__env.apiKey = 'your_gemini_api_key_here';
  
  // For development without proxy or API key, you can test the UI
  // but AI features will not work
})();
