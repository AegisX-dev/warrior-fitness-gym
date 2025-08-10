export const getToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
};

export const getUserType = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('userType');
  }
  return null;
};

export const isAuthenticated = () => {
  return !!getToken();
};

export const logout = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
    localStorage.removeItem('userType');
    window.location.href = '/';
  }
};

export const redirectBasedOnRole = () => {
  const userType = getUserType();
  if (userType === 'admin') {
    window.location.href = '/admin/dashboard';
  } else if (userType === 'member') {
    window.location.href = '/member/dashboard';
  } else {
    window.location.href = '/auth/login';
  }
};
