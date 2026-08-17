import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

export default function AppLayout({ children }) {
  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <Sidebar />
      <Header />
      <main className="ml-60 pt-12 min-h-screen">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
