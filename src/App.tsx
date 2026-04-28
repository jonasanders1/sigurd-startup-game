import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import MainGame from "./components/MainGame";
import { TooltipProvider } from "./components/ui/tooltip";
import { EditorRoot } from "./editor/EditorRoot";
import { PreviewMode } from "./editor/PreviewMode";
import { useEditorStore } from "./editor/store";

const queryClient = new QueryClient();

const isEditorMode = (): boolean => {
  if (typeof window === "undefined") return false;
  const params = new URLSearchParams(window.location.search);
  return params.get("edit") === "1";
};

const App = () => {
  const previewActive = useEditorStore((s) => s.previewActive);

  if (isEditorMode()) {
    if (previewActive) {
      return <PreviewMode />;
    }
    return <EditorRoot />;
  }
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <MainGame />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
