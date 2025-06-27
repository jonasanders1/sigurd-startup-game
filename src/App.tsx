import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import BombJackGame from "./components/BombJackGame";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>

    <div className="min-h-screen">
      <BombJackGame />
    </div>

  </QueryClientProvider>
);

export default App;
