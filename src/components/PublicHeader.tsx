import { useNavigate, useLocation } from "react-router-dom";
import sikakLogo from "@/assets/sikak-logo.png";

export default function PublicHeader() {
  const navigate = useNavigate();
  const location = useLocation();

  const goSection = (id: string) => {
    if (location.pathname !== "/") {
      navigate(`/#${id}`);
      return;
    }
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <header className="sticky top-0 z-50 border-b border-emerald-900/10 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="flex items-center gap-3 text-left"
        >
          <img src={sikakLogo} alt="SIKAK" className="h-10 w-10 object-contain" />
          <div>
            <p className="text-base font-bold leading-tight text-emerald-950">
              SIKAK
            </p>
            <p className="text-[11px] leading-tight text-slate-500">
              Kartu Asuhan Keperawatan
            </p>
          </div>
        </button>

        <nav className="hidden items-center gap-7 text-sm font-semibold text-slate-600 md:flex">
          <button type="button" onClick={() => navigate("/")} className="hover:text-emerald-700">
            Dashboard
          </button>
          <button type="button" onClick={() => goSection("riwayat")} className="hover:text-emerald-700">
            Riwayat Pembaruan
          </button>
          <button type="button" onClick={() => goSection("latar-belakang")} className="hover:text-emerald-700">
            Latar Belakang
          </button>
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="rounded-md bg-emerald-800 px-4 py-2 text-white hover:bg-emerald-900"
          >
            Login
          </button>
        </nav>
      </div>
    </header>
  );
}
