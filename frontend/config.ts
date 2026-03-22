// Centralized API Configuration map
// This file acts as the single source of truth for all API endpoint fallbacks, preventing URL scattering across the codebase.

export const API_BASE_URL = import.meta.env?.VITE_API_URL || 'https://sentience-xq1s.onrender.com/api';
export const SITE_URL = import.meta.env?.VITE_SITE_URL || 'https://sentience-xq1s.onrender.com';
export const IS_PRODUCTION = import.meta.env?.PROD || false;
