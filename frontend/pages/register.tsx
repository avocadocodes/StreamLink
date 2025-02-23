import { useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";

const RegisterPage = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL;
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(`${backendURL}/register`, {
        email,
        username,
        password,
      });
      alert("Registration successful! Please login.");
      router.push("/login");
    } catch (error: any) {
      console.error("Registration Error:", error.response?.data);
      setError(error.response?.data?.detail || "An error occurred.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-2xl font-bold">Register</h1>
      {error && <p className="text-red-500">{error}</p>}
      <form onSubmit={handleRegister} className="mt-6">
        <input
          type="email"
          placeholder="Email"
          className="border p-2 m-2"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Username"
          className="border p-2 m-2"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          className="border p-2 m-2"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button className="bg-green-500 text-white px-4 py-2 rounded mt-2">
          Register
        </button>
      </form>
    </div>
  );
};

export default RegisterPage;
