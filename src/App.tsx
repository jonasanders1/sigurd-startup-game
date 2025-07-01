import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import MainGame from "./components/MainGame";
import { TooltipProvider } from "./components/ui/tooltip";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <div className="min-h-screen bg-background flex items-center justify-center">
        <MainGame />
      </div>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
