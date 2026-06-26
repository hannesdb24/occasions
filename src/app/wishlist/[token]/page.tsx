import { notFound } from "next/navigation";

interface WishItem {
  id: string;
  title: string;
  description: string | null;
  url: string | null;
  priceMin: number | null;
  priceMax: number | null;
  status: string;
}

interface PublicWishList {
  ownerName: string | null;
  ownerImage: string | null;
  title: string;
  items: WishItem[];
}

async function getWishList(token: string): Promise<PublicWishList | null> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/wishlist/share/${token}`, { cache: "no-store" });
  if (!res.ok) return null;
  return res.json();
}

export default async function PublicWishListPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const wishList = await getWishList(token);
  if (!wishList) notFound();

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-xl mx-auto px-4 py-14">
        <div className="text-center mb-10">
          <span className="inline-flex flex-col items-center leading-none mb-8">
            <span className="font-serif font-medium tracking-tight text-[20px] text-[var(--foreground)]">Occasions</span>
            <span className="mt-1.5 h-px w-2/3 bg-[#c4704a] opacity-80" />
          </span>
          <h1 className="font-serif text-2xl font-medium text-[var(--foreground)] mt-6">
            {wishList.ownerName ? `${wishList.ownerName}s Wunschliste` : wishList.title}
          </h1>
          <p className="text-sm mt-2" style={{ color: "var(--muted-foreground)" }}>
            {wishList.items.filter((i) => i.status === "OPEN").length} offene Wünsche
          </p>
        </div>

        {wishList.items.length === 0 && (
          <div className="text-center py-12 editorial-italic" style={{ color: "var(--muted-foreground)" }}>
            <p>Noch keine Wünsche eingetragen.</p>
          </div>
        )}

        <div className="space-y-3">
          {wishList.items.map((item) => (
            <div
              key={item.id}
              className={`bg-card border-hairline rounded-xl p-4 ${item.status !== "OPEN" ? "opacity-50" : ""}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className={`font-medium ${item.status === "FULFILLED" ? "line-through" : "text-[var(--foreground)]"}`}>
                    {item.title}
                  </div>
                  {item.description && (
                    <p className="text-sm mt-0.5" style={{ color: "var(--muted-foreground)" }}>{item.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2">
                    {item.url && (
                      <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-sm text-[#c4704a] hover:underline font-medium">
                        Ansehen →
                      </a>
                    )}
                    {(item.priceMin || item.priceMax) && (
                      <span className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                        {item.priceMin && `ab ${item.priceMin} €`}
                        {item.priceMin && item.priceMax && " – "}
                        {item.priceMax && `${item.priceMax} €`}
                      </span>
                    )}
                  </div>
                </div>
                {item.status === "RESERVED" && (
                  <span className="text-xs bg-[#c4704a]/10 text-[#c4704a] px-2.5 py-1 rounded-full font-medium flex-shrink-0">
                    Bereits reserviert
                  </span>
                )}
                {item.status === "FULFILLED" && (
                  <span className="text-xs bg-[rgba(28,25,22,0.06)] px-2.5 py-1 rounded-full font-medium flex-shrink-0" style={{ color: "var(--muted-foreground)" }}>
                    Erfüllt ✓
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-xs mt-10" style={{ color: "var(--muted-foreground)" }}>
          Erstellt mit{" "}
          <a href="/" className="text-[#c4704a] hover:underline">Occasions</a>
        </p>
      </div>
    </div>
  );
}
