import { createContext, useState, useContext } from "react";

const LoadingContext = createContext(); // create context object

export function LoadingProvider({ children }) {
  const [loading, setLoading] = useState(true); // central state
  return (
    <LoadingContext.Provider value={{ loading, setLoading }}>
      {children}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  return useContext(LoadingContext); // custom hook for easy usage
}
