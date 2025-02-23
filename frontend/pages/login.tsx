import { useContext, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { useRouter } from "next/router";

const LoginPage = () => {
  const auth = useContext(AuthContext);
  const router = useRouter();

  if (!auth) {
    return <p>Loading...</p>;
  }

  const { login } = auth;
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(username, password);
    router.push("/");
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-2xl font-bold">Login</h1>
      <form onSubmit={handleLogin} className="mt-6">
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
        <button className="bg-blue-500 text-white px-4 py-2 rounded mt-2">
          Login
        </button>
      </form>
    </div>
  );
};

export default LoginPage;
