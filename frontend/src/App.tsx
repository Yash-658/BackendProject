import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Navbar, ProtectedRoute } from "./components";
import { AuthProvider } from "./context/AuthContext";
import {
  LoginPage,
  ProblemDetailPage,
  ProblemsPage,
  RegisterPage,
  SubmissionsPage,
  UsersPage,
} from "./pages";

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="app-shell">
          <Navbar />
          <main className="container main-content">
            <Routes>
              <Route path="/" element={<Navigate to="/problems" replace />} />
              <Route path="/problems" element={<ProblemsPage />} />
              <Route path="/problems/:problemId" element={<ProblemDetailPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route
                path="/submissions"
                element={
                  <ProtectedRoute>
                    <SubmissionsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/users"
                element={
                  <ProtectedRoute>
                    <UsersPage />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to="/problems" replace />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
