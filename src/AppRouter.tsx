import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import MainPage from "./pages/MainPage";
import RigsListPage from "./pages/RigsListPage/RigsListPage.tsx";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PrimeReactProvider } from 'primereact/api';
import DynamicWidgetPage from './pages/DynamicWidgetPage/DynamicWidgetPage.tsx'; // Универсальный компонент
import MaintenancePage from "./components/MaintenancePage/MaintenancePage.tsx";
import ArchivePage from "./pages/ArchivePage/ArchivePage.tsx";
import ElectricalDiagramPage from "./pages/ElectricalDiagramPage/ElectricalDiagramPage.tsx";
import WinchBlockPage from "./pages/WinchBlockPage/WinchBlockPage.tsx";
import PumpBlockPage from "./pages/PumpBlockPage/PumpBlockPage.tsx";
import VideoPage from "./pages/VideoPage/VideoPage.tsx";
import PowerConsumptionPage from "./pages/PowerConsumptionPage/PowerConsumptionPage.tsx";
import DocumentsPage from "./pages/DocumentsPage/DocumentsPage.tsx";

const queryClient = new QueryClient();

const Layout = () => (
  <>
    <Outlet />
  </>
);

export default function AppRouter() {
  return (
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <PrimeReactProvider>
            <Routes>
              {/* Главная страница со списком буровых */}
              <Route path="/" element={<RigsListPage />} />

              {/* Детальная страница буровой - USES LAYOUT */}
              <Route element={<Layout />}>
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
          </PrimeReactProvider>
        </QueryClientProvider>
      </BrowserRouter>
  );
}