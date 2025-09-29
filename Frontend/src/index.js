
// ...
import { AuthProvider } from './contexts/AuthContext';

// ...
root.render(
  <React.StrictMode>
    <AuthProvider>
      <App /> {/* Or your main router component */}
    </AuthProvider>
  </React.StrictMode>
);