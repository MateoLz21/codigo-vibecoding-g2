import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthUser {
  username: string;
  email: string;
  is_superuser: boolean;
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  _hasHydrated: boolean;
  setTokens: (tokens: { accessToken: string; refreshToken: string; user?: AuthUser }) => void;
  clear: () => void;
  setHasHydrated: (value: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      _hasHydrated: false,
      setTokens: ({ accessToken, refreshToken, user }) =>
        set((state) => ({
          accessToken,
          refreshToken,
          user: user !== undefined ? user : state.user,
        })),
      clear: () => set({ accessToken: null, refreshToken: null, user: null }),
      setHasHydrated: (value) => set({ _hasHydrated: value }),
    }),
    {
      name: "logistica-auth",
      partialize: (state) => ({
        refreshToken: state.refreshToken,
        user: state.user,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
