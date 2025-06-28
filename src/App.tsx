import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import MainGame from "./components/MainGame";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>

    <div className="min-h-screen">
      <MainGame />
    </div>

  </QueryClientProvider>
);

export default App;
