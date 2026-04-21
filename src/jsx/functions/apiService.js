/**
 * apiService.js
 * Centralized service for handling all API requests.
 */

const API_BASE = '/api/data';

const getAuthToken = (userId) => `Bearer auth-token-${userId}`;

export const apiRequest = async (type, body = {}, userId = null, method = 'POST') => {
  if (!userId) {
    const stored = localStorage.getItem('currentUser');
    if (stored) userId = JSON.parse(stored).id;
  }

  const url = new URL(API_BASE, window.location.origin);
  url.searchParams.set('type', type);
  if (userId) url.searchParams.set('userId', userId);

  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': getAuthToken(userId)
    }
  };

  if (method === 'POST') {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url.toString(), options);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Ocurrió un error en la comunicación con el servidor.');
    }

    return data;
  } catch (error) {
    console.error(`API Error (${type}):`, error);
    throw error;
  }
};

export const apiLoadData = async (userId, selectedYearId, selectedCourseId, includeAllStudents = false) => {
  const url = new URL(API_BASE, window.location.origin);
  url.searchParams.set('type', 'grid');
  url.searchParams.set('userId', userId);
  url.searchParams.set('yearId', selectedYearId);
  if (selectedCourseId) url.searchParams.set('courseId', selectedCourseId);
  if (includeAllStudents) url.searchParams.set('includeAllStudents', 'true');

  const options = {
    method: 'GET',
    headers: {
      'Authorization': getAuthToken(userId)
    }
  };

  try {
    const response = await fetch(url.toString(), options);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Error al cargar los datos.');
    }

    return data;
  } catch (error) {
    console.error('API LoadData Error:', error);
    throw error;
  }
};
