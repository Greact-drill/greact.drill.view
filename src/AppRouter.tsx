import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import MainPage from "./pages/MainPage";
import RigsListPage from "./pages/RigsListPage";
import TopBar from "./components/TopBar";
import ChartsPage from "./pages/ChartsPage.tsx";
import TagsPage from "./pages/TagsPage";
import AdminPage from "./pages/AdminPage.tsx";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PrimeReactProvider } from 'primereact/api';

const queryClient = new QueryClient();

const Nav = () => (
  <TopBar />
);

const Layout = () => (
  <>
    <Nav />
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
                <Route path="/tags" element={<TagsPage />} />
              </Route>

              {/* Админ-панель - NO LAYOUT, self-contained */}
              <Route path="/admin/*" element={<AdminPage />} /> 

              {/* 404 */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </PrimeReactProvider>
        </QueryClientProvider>
      </BrowserRouter>
  );
}