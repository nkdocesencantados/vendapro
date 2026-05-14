import { create } from "zustand";
import { persist } from "zustand/middleware";
import Cookies from "js-cookie";
import { api } from "@/lib/api";

interface User {
  id: string; name: string; email: string;
  role: string; storeId?: string; permissions?: any;
}

interface AuthState {
  user: User | null; token: string | null;
  isAuthenticated: boolean; isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loadUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null, token: null, isAuthenticated: false, isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const res = await api.post("/auth/login", { email, password });
          const { accessToken, user } = res.data;
          Cookies.set("vendapro_token", accessToken, { expires: 7 });
          set({ user, token: accessToken, isAuthenticated: true, isLoading: false });
        } catch (err) {
          set({ isLoading: false });
          throw err;
        }
      },

      logout: () => {
        Cookies.remove("vendapro_token");
        set({ user: null, token: null, isAuthenticated: false });
      },

      loadUser: async () => {
        const token = Cookies.get("vendapro_token");
        if (!token) return;
        try {
          const res = await api.get("/auth/me");
          set({ user: res.data, token, isAuthenticated: true });
        } catch {
          Cookies.remove("vendapro_token");
          set({ user: null, token: null, isAuthenticated: false });
        }
      },
    }),
    { name: "auth-storage", partialize: (s) => ({ token: s.token, user: s.user }) }
  )
);
