import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import DraftsBoard from "./DraftsBoard";

/* The drafts page, in the FALO house system shared with the landing, pricing
   and templates pages. Access is guarded by `layout.tsx`; everything the
   visitor works with lives in `DraftsBoard`. */

export default function DraftsPage() {
  return (
    <div
      className="lp relative z-10 flex min-h-screen flex-col overflow-x-clip"
    >
      <Navbar />
      <main className="flex flex-1 flex-col">
        <DraftsBoard />
      </main>
      <Footer />
    </div>
  );
}
