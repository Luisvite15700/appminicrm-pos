
import * as SecureStore from 'expo-secure-store';
import { createContext, useContext, useEffect, useState } from 'react';


const SessionContext = createContext<{
  setSession: (session: string | null) => void;
  session?: string | null;
  isLoading: boolean;
}>({
  setSession: () => null,
  session: null,
  isLoading: false,
});

export function useSession() {
  const value = useContext(SessionContext);
  if (process.env.NODE_ENV !== 'production') {
    if (!value) {
      throw new Error('useSession must be wrapped in a <SessionProvider />');
    }
  }

  return value;
}

export function SessionProvider(props: { children: React.ReactNode }) {
  const [session, setSession] = useState<string | null>();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    SecureStore.getItemAsync("session").then(session => {
      setSession(session);
      setIsLoading(false);
    });
  }, []);

  return (
    <SessionContext.Provider
      value={{
        setSession: (session) => {
          if (session) {
            SecureStore.setItem("session", session);
          } else {
            SecureStore.deleteItemAsync("session");
          }
          setSession(session);
        },
        session,
        isLoading,
      }}>
      {props.children}
    </SessionContext.Provider>
  );
}
