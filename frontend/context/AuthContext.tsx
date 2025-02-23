import { createContext, useState, useEffect, ReactNode, useContext } from "react";
import axios, { AxiosError } from "axios";
import Cookies from "js-cookie";
import { useRouter } from "next/router";

const api = axios.create({
  baseURL:process.env.NEXT_PUBLIC_BACKEND_URL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = Cookies.get("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export { api };

interface User {
  id: string;
  username: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    const token = Cookies.get("token");
    if (token) {
      api.get("/user") 
        .then((res) => {
          console.log("✅ User Data:", res.data);
          setUser(res.data);
        })
        .catch((error) => {
          console.error("❌ Failed to fetch user:", error.response?.data || error.message);
          Cookies.remove("token");
          setUser(null);
        });
    }
  }, []);

  const login = async (identifier: string, password: string) => {
    try {
      const formData = new FormData();
      formData.append("username", identifier);
      formData.append("password", password);
  
      const res = await api.post("/token", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const token = res.data.access_token;
      Cookies.set("token", token, { expires: 7 });

      const userRes = await api.get("/user");
      setUser(userRes.data);
      console.log("🔓 Logged in successfully!", userRes.data);
      router.push("/");
    } catch (error) {
      const axiosError = error as AxiosError;
      console.error("❌ Login Error:", axiosError.response?.data || axiosError.message);
      alert("Invalid credentials. Please try again.");
    }
  };

  const logout = () => {
    Cookies.remove("token");
    setUser(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for easier access to AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
