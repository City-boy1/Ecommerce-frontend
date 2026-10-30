
import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import axiosPublic ,{ axiosPrivate, refreshAccessToken,setAccessToken} from "../api/axios";
import LoadingWave from "../components/Loading";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const hydrate = async () => {
  try {
    const response = await axiosPrivate.get("/users/me");
    if (response.data?.user) setUser(response.data.user);
    } catch {
      /* keep the short user */
    }
  };

  useEffect(() => {
    let mounted = true
    const boot = async()=>{
    try {
      const data = await refreshAccessToken();
      if (!mounted) return;
      setUser(data.user);
      await hydrate();
    } catch (err) {
      if (!mounted) return;
      setUser(null);
    }finally{
        if(mounted) setAuthLoading(false)
      }
    }
    boot()
    return ()=>{mounted = false}
  }, []);

  const signup = async (name, email, password) => {
    setError(null);

    const response = await axiosPublic.post("/auth/signup", {
      name,
      email,
      password,
    });

    if (response.data.accessToken) {
      setAccessToken(response.data.accessToken);
    }

    if (response.data.user) {
      setUser(response.data.user);
      await hydrate();
    }

    return response.data;
  };

  const login = async (email, password) => {
    setError(null);

    const response = await axiosPublic.post("/auth/login", {
      email,
      password,
    });

    setAccessToken(response.data.accessToken);
    setUser(response.data.user);
    await hydrate();

    return response.data;
  };

  const getMe = async () => {
    const response = await axiosPrivate.get("/users/me");
    setUser(response.data.user);
    return response.data.user;
  };

  const logout = async () => {
    try {
      await axiosPrivate.post("/auth/logout");
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated:!!user,
        error,
        setError,
        setAuthLoading,
        authLoading,
        signup,
        login,
        logout,
        getMe,
      }}
    >
      {authLoading ? (
        <LoadingWave/>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}