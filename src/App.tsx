import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import VoicePrayerNavigator from "./Components/VoicePrayerNavigator";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <div className=" bg-linear-to-br from-indigo-50 via-purple-50 pb-0! to-pink-50 p-6 sm:p-10">
        <div className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold bg-linear-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            Holy Mass Prayers
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">
            Malayalam prayers with English translations
          </p>
        </div>
        <VoicePrayerNavigator />
      </div>
    </QueryClientProvider>
  );
};

export default App;
