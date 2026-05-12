import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";
import sikakLogo from "@/assets/sikak-logo.png";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
      <img src={sikakLogo} alt="SIKAK" width={80} height={80} className="mb-6 opacity-50" />
      <h1 className="text-6xl font-bold text-primary mb-2">404</h1>
      <p className="text-lg text-muted-foreground mb-6">Halaman tidak ditemukan</p>
      <Button onClick={() => navigate("/")} className="gap-2">
        <Home className="h-4 w-4" />
        Kembali ke Beranda
      </Button>
    </div>
  );
}
