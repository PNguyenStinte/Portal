import { Navigate } from 'react-router-dom';

export default function PrivateRoute({ children }) {
  const token = sessionStorage.getItem('token');
  const isLocal = window.location.hostname === 'localhost';

  // In local dev, always allow access
  if (isLocal) {
    return children;
  }

  // In production, require token
  return token ? children : <Navigate to="/" />;
}
