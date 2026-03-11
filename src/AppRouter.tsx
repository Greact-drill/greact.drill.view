import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PrimeReactProvider } from "primereact/api";
import Loader from "./components/Loader";
import AppLayout from "./components/Layout/AppLayout";

const MainPage = lazy(() => import("./pages/MainPage"));
const RigsListPage = lazy(() => import("./pages/RigsListPage/RigsListPage.tsx"));
const DynamicWidgetPage = lazy(() => import("./pages/DynamicWidgetPage/DynamicWidgetPage.tsx"));
const MaintenancePage = lazy(() => import("./components/MaintenancePage/MaintenancePage.tsx"));
const ArchivePage = lazy(() => import("./pages/ArchivePage/ArchivePage.tsx"));
const ElectricalDiagramPage = lazy(
  () => import("./pages/ElectricalDiagramPage/ElectricalDiagramPage.tsx")
);
const WinchBlockPage = lazy(() => import("./pages/WinchBlockPage/WinchBlockPage.tsx"));
const PumpBlockPage = lazy(() => import("./pages/PumpBlockPage/PumpBlockPage.tsx"));
const VideoPage = lazy(() => import("./pages/VideoPage/VideoPage.tsx"));
const PowerConsumptionPage = lazy(
  () => import("./pages/PowerConsumptionPage/PowerConsumptionPage.tsx")
);
const DocumentsPage = lazy(() => import("./pages/DocumentsPage/DocumentsPage.tsx"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 15_000,
      refetchOnWindowFocus: false,
    },
  },
});

export default function AppRouter() {
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <PrimeReactProvider>
          <Suspense fallback={<Loader variant="fullscreen" message="" />}>
            <Routes>
              {/* Главная страница со списком буровых */}
              <Route path="/" element={<RigsListPage />} />

              {/* Детальная страница буровой - USES LAYOUT */}
              <Route element={<AppLayout />}>
                <Route path="/rigs/:rigId" element={<MainPage />} />
                <Route path="/rigs/:rigId/archive" element={<ArchivePage />} />
                <Route path="/rigs/:rigId/electrical-diagram" element={<ElectricalDiagramPage />} />
                <Route path="/rigs/:rigId/winch-block" element={<WinchBlockPage />} />
                <Route path="/rigs/:rigId/pump-block" element={<PumpBlockPage />} />
                <Route path="/rigs/:rigId/video" element={<VideoPage />} />
                <Route path="/rigs/:rigId/documents" element={<DocumentsPage />} />
                <Route path="/rigs/:rigId/power-consumption" element={<PowerConsumptionPage />} />
              </Route>

              {/* Универсальные маршруты для виджетов */}
              <Route path="/rigs/:rigId/widgets/:pageType" element={<DynamicWidgetPage />} />
              
              {/* Редиректы для старых маршрутов */}
              <Route path="/rigs/:rigId/bypass-status" element={<Navigate to="/rigs/:rigId/widgets/BYPASS" replace />} />
              <Route path="/rigs/:rigId/accident-status" element={<Navigate to="/rigs/:rigId/widgets/ACCIDENT" replace />} />
              <Route path="/ktu/:rigId" element={<Navigate to="/rigs/:rigId/widgets/KTU" replace />} />
              <Route path="/pumpblock/:rigId" element={<Navigate to="/rigs/:rigId/widgets/PUMPBLOCK" replace />} />
              
              {/* Техническое обслуживание - специальная страница */}
              <Route path="/rigs/:rigId/maintenance-status/:maintenanceType" element={<MaintenancePage />} />

              {/* 404 */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </PrimeReactProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
}