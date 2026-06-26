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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white">
      <div className="max-w-xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🎁</div>
          <h1 className="text-2xl font-bold text-gray-900">
            {wishList.ownerName ? `${wishList.ownerName}s Wunschliste` : wishList.title}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {wishList.items.filter((i) => i.status === "OPEN").length} offene Wünsche
          </p>
        </div>

        {wishList.items.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <p>Noch keine Wünsche eingetragen.</p>
          </div>
        )}

        <div className="space-y-3">
          {wishList.items.map((item) => (
            <div
              key={item.id}
              className={`bg-white rounded-xl border p-4 ${
                item.status !== "OPEN" ? "opacity-60 border-gray-100" : "border-gray-100 shadow-sm"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className={`font-medium ${item.status === "FULFILLED" ? "line-through text-gray-400" : "text-gray-900"}`}>
                    {item.title}
                  </div>
                  {item.description && (
                    <p className="text-sm text-gray-500 mt-0.5">{item.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2">
                    {item.url && (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-indigo-600 hover:underline font-medium"
                      >
                        Ansehen →
                      </a>
                    )}
                    {(item.priceMin || item.priceMax) && (
                      <span className="text-sm text-gray-400">
                        {item.priceMin && `ab ${item.priceMin} €`}
                        {item.priceMin && item.priceMax && " – "}
                        {item.priceMax && `${item.priceMax} €`}
                      </span>
                    )}
                  </div>
                </div>
                {item.status === "RESERVED" && (
                  <span className="text-xs bg-amber-50 text-amber-600 px-2 py-1 rounded-full font-medium flex-shrink-0">
                    Bereits reserviert
                  </span>
                )}
                {item.status === "FULFILLED" && (
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full font-medium flex-shrink-0">
                    Erfüllt ✓
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-gray-400 mt-8">
          Erstellt mit{" "}
          <a href="/" className="text-indigo-500 hover:underline">Occasions</a>
        </p>
      </div>
    </div>
  );
}
