import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import MainPage from "./pages/MainPage";
import RigsListPage from "./pages/RigsListPage/RigsListPage.tsx";
import ChartsPage from "./pages/ChartPages/ChartsPage.tsx";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PrimeReactProvider } from 'primereact/api';
import BypassStatusPage from './pages/BypassStatusPage/BypassStatusPage.tsx';
import AccidentStatusPage from "./components/AccidentStatusPage.tsx";
import MaintenancePage from "./components/MaintenancePage/MaintenancePage.tsx";
import KtuPage from "./pages/KtuPage/KtuPage.tsx"; // 💡 Шаг 1: Добавьте импорт KtuPage
import PumpBlockPage from "./pages/PumpBlockPage/PumpBlockPage.tsx";
import ArchivePage from "./pages/ArchivePage/ArchivePage.tsx"; 


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
                <Route path="/charts" element={<ChartsPage />} />
                <Route path="/rigs/:rigId/archive" element={<ArchivePage />} />
              </Route>

              <Route path="/rigs/:rigId/bypass-status" element={<BypassStatusPage />} />
              <Route path="/rigs/:rigId/accident-status" element={<AccidentStatusPage/>}/>
              <Route path="/rigs/:rigId/maintenance-status/:maintenanceType" element={<MaintenancePage />} />
              <Route path="/ktu/:rigId" element={<KtuPage />} />
              <Route path="/pumpblock/:rigId" element={<PumpBlockPage />} />

              {/* 404 */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </PrimeReactProvider>
        </QueryClientProvider>
      </BrowserRouter>
  );
}