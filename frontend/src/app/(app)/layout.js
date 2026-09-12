import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { api } from "@/lib/api";

export default async function AppLayout({ children }) {
  // Fetch real nav tree server-side — clients → projects → docs
  let navTree = [];
  try {
    navTree = await api.get("/nav-tree");
  } catch {
    // Silently fail — sidebar will show empty state
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <Sidebar navTree={navTree} />
      <Header />
      <main className="ml-60 pt-12 min-h-screen">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
