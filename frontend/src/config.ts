// Get the API URL from environment variables, with a fallback for local development
const API_URL_FROM_ENV = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Export the base URL (e.g., http://localhost:5000)
export const API_BASE_URL = API_URL_FROM_ENV.replace(/\/api\/?$/, '');
 
// Export the full API endpoint URL (e.g., http://localhost:5000/api)
export const API_URL = `${API_BASE_URL}/api`; 