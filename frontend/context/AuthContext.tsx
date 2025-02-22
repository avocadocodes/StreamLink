import { createContext, useState, useEffect, ReactNode } from "react";
import axios from "axios";
import Cookies from "js-cookie";

interface User {
    email: string;
    username: string;
  }

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType>({
    user: null,
    login: async () => {},
    logout: () => {},
  });
  

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const token = Cookies.get("token");
    if (token) fetchProfile(token);
  }, []);

  const fetchProfile = async (token: string) => {
    try {
      const res = await axios.get("http://localhost:8000/users/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(res.data);
    } catch (error) {
      console.error("Failed to fetch user profile", error);
    }
  };

  const login = async (email: string, password: string) => {
    const res = await axios.post("http://localhost:8000/auth/login", { email, password });
    Cookies.set("token", res.data.access_token, { expires: 1 });
    fetchProfile(res.data.access_token);
  };

  const logout = () => {
    Cookies.remove("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
