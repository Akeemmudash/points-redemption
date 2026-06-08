import { createContext, useState, useEffect } from "react";
import { client } from "@/api/client";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  useEffect(() => {
    async function bootstrap() {
      const token = localStorage.getItem("prs_token");
      if (token) {
        try {
          const response = await client.get("/me");
          setUser(response.data);
          setIsAuthenticated(true);
        } catch {
          localStorage.removeItem("prs_token");
          setUser(null);
          setIsAuthenticated(false);
        }
      }
      setIsBootstrapping(false);
    }

    bootstrap();

    const handleUnauthorized = () => {
      setUser(null);
      setIsAuthenticated(false);
    };

    window.addEventListener("auth-unauthorized", handleUnauthorized);

    return () => {
      window.removeEventListener("auth-unauthorized", handleUnauthorized);
    };
  }, []);

  const login = async (email, password) => {
    const response = await client.post("/login", { email, password });
    const { token, user: userData } = response.data;
    localStorage.setItem("prs_token", token);
    setUser(userData);
    setIsAuthenticated(true);
    return userData;
  };

  const logout = async () => {
    try {
      await client.post("/logout");
    } catch {
      // Ignore network errors on logout and clear locally anyway
    } finally {
      localStorage.removeItem("prs_token");
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isBootstrapping,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
