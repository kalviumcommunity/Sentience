const API_URL = import.meta.env.VITE_API_URL || 'https://sentience-xq1s.onrender.com/api';

// Helper function to make authenticated requests with retry and rate limiting
const authRequest = async (endpoint, options = {}, retries = 3) => {
  // Import rate limiter and CSRF protection dynamically to avoid circular dependencies
  const { canMakeApiRequest } = await import('@/utils/rateLimiter');
  const { csrfProtection } = await import('@/utils/csrf');
  
  if (!canMakeApiRequest(endpoint)) {
    throw new Error('Rate limit exceeded. Please try again later.');
  }

  const headers = {
    'Content-Type': 'application/json',
    ...(await csrfProtection.addTokenToHeaders(options.headers))
  };

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
        credentials: 'include'
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'API request failed' }));
        
        // Don't retry on authentication errors
        if (response.status === 401 || response.status === 403) {
          throw new Error(error.message || 'Authentication failed');
        }
        
        // Don't retry on client errors (4xx)
        if (response.status >= 400 && response.status < 500) {
          throw new Error(error.message || 'Request failed');
        }
        
        // Retry on server errors (5xx) or network errors
        if (attempt === retries) {
          throw new Error(error.message || 'Server error');
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        continue;
      }

      return await response.json();
    } catch (error) {
      if (attempt === retries) {
        console.error(`[authRequest] Failed after ${retries} attempts:`, error);
        throw error;
      }
      
      // Wait before retrying
      console.warn(`[authRequest] Attempt ${attempt} failed, retrying...`, error);
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
};

// Task API functions
export const taskAPI = {
  getAll: () => authRequest('/tasks'),
  create: (taskData) => authRequest('/tasks', {
    method: 'POST',
    body: JSON.stringify(taskData)
  }),
  update: (id, taskData) => authRequest(`/tasks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(taskData)
  }),
  delete: (id) => authRequest(`/tasks/${id}`, {
    method: 'DELETE'
  })
};

// Mood API functions
export const moodAPI = {
  getAll: () => authRequest('/mood'),
  create: (moodData) => authRequest('/mood', {
    method: 'POST',
    body: JSON.stringify(moodData)
  }),
  delete: (id) => authRequest(`/mood/${id}`, {
    method: 'DELETE'
  })
};

// Study Session API functions
export const studyAPI = {
  getAll: () => authRequest('/study-sessions'),
  create: (sessionData) => authRequest('/study-sessions', {
    method: 'POST',
    body: JSON.stringify(sessionData)
  }),
  update: (id, sessionData) => authRequest(`/study-sessions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(sessionData)
  }),
  delete: (id) => authRequest(`/study-sessions/${id}`, {
    method: 'DELETE'
  })
};

// Focus Session API functions
export const focusAPI = {
  getAll: () => authRequest('/focus-sessions'),
  create: (sessionData) => authRequest('/focus-sessions', {
    method: 'POST',
    body: JSON.stringify(sessionData)
  }),
  delete: (id) => authRequest(`/focus-sessions/${id}`, {
    method: 'DELETE'
  })
};

// Health check
export const healthCheck = () => fetch(`${API_URL}/health`, { credentials: 'include' }).then(res => res.json()); 