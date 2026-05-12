import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import AppLayout from "./components/AppLayout";
import AppDashboard from "./pages/AppDashboard";
import KartuAsuhanPage from "./pages/KartuAsuhanPage";
import NewCard from "./pages/NewCard";
import CardDetail from "./pages/CardDetail";
import Flow2Page from "./pages/Flow2Page";
import LaporanPage from "./pages/LaporanPage";
import DataKeluargaPage from "./pages/DataKeluargaPage";
import KeluargaDetailPage from "./pages/KeluargaDetailPage";
import KeluargaFormPage from "./pages/KeluargaFormPage";
import PuskesmasPage from "./pages/PuskesmasPage";
import PengaturanPage from "./pages/PengaturanPage";
import DaftarMasukPage from "./pages/DaftarMasukPage";
import PenggunaPage from "./pages/PenggunaPage";
import PenggunaFormPage from "./pages/PenggunaFormPage";
import CetakPage from "./pages/CetakPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/cetak/:id" element={<CetakPage />} />
          <Route path="/app" element={<AppLayout />}>
            <Route index element={<AppDashboard />} />
            <Route path="kartu" element={<KartuAsuhanPage />} />
            <Route path="kartu/baru" element={<NewCard />} />
            <Route path="kartu/family/:id_keluarga" element={<Flow2Page />} />
            <Route path="kartu/:id" element={<CardDetail />} />
            <Route path="daftar-masuk" element={<DaftarMasukPage />} />
            <Route path="laporan" element={<LaporanPage />} />
            <Route path="keluarga" element={<DataKeluargaPage />} />
            <Route path="keluarga/baru" element={<KeluargaFormPage />} />
            <Route path="keluarga/:id" element={<KeluargaDetailPage />} />
            <Route path="keluarga/:id/edit" element={<KeluargaFormPage />} />
            <Route path="puskesmas" element={<PuskesmasPage />} />
            <Route path="pengguna" element={<PenggunaPage />} />
            <Route path="pengguna/baru" element={<PenggunaFormPage />} />
            <Route path="pengaturan" element={<PengaturanPage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
