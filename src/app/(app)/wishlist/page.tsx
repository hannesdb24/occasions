"use client";

import { useEffect, useState } from "react";

interface WishItem {
  id: string;
  title: string;
  description: string | null;
  url: string | null;
  priceMin: number | null;
  priceMax: number | null;
  status: string;
  priority: number;
}

interface WishList {
  id: string;
  title: string;
  isPublic: boolean;
  shareToken: string | null;
  items: WishItem[];
}

export default function WishListPage() {
  const [wishList, setWishList] = useState<WishList | null>(null);
  const [loading, setLoading] = useState(true);
  const [newItem, setNewItem] = useState({ title: "", url: "", priceMin: "", priceMax: "", description: "" });
  const [adding, setAdding] = useState(false);
  const [showForm, setShowForm] = useState(false);

  async function load() {
    const res = await fetch("/api/wishlist");
    if (res.ok) setWishList(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function togglePublic() {
    if (!wishList) return;
    const res = await fetch("/api/wishlist", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublic: !wishList.isPublic }),
    });
    if (res.ok) setWishList(await res.json());
  }

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    setAdding(true);
    const res = await fetch("/api/wishlist/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: newItem.title,
        url: newItem.url || null,
        description: newItem.description || null,
        priceMin: newItem.priceMin ? parseFloat(newItem.priceMin) : null,
        priceMax: newItem.priceMax ? parseFloat(newItem.priceMax) : null,
      }),
    });
    if (res.ok) {
      await load();
      setNewItem({ title: "", url: "", priceMin: "", priceMax: "", description: "" });
      setShowForm(false);
    }
    setAdding(false);
  }

  async function deleteItem(id: string) {
    await fetch(`/api/wishlist/items/${id}`, { method: "DELETE" });
    await load();
  }

  async function markFulfilled(id: string) {
    await fetch(`/api/wishlist/items/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "FULFILLED" }),
    });
    await load();
  }

  if (loading) return <div className="py-16 text-center" style={{ color: "var(--muted-foreground)" }}>Wird geladen...</div>;

  const appUrl = typeof window !== "undefined" ? window.location.origin : "";
  const shareUrl = wishList?.shareToken ? `${appUrl}/wishlist/${wishList.shareToken}` : null;

  const inputClass = "w-full px-4 py-2.5 border-hairline rounded-xl focus:outline-none focus:ring-2 focus:ring-[#c4704a]/30 bg-[var(--background)] text-sm transition-considered";

  return (
    <div className="max-w-2xl">
      <header className="flex items-center justify-between mb-10">
        <div>
          <p className="kicker mb-2">Meine Liste</p>
          <h1 className="font-serif text-3xl font-medium text-[var(--foreground)]">Wunschliste</h1>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-5 py-2.5 bg-[var(--foreground)] text-[var(--card)] rounded-full text-sm font-medium hover:opacity-90 transition-considered"
        >
          + Wunsch
        </button>
      </header>

      {/* Teilen */}
      <div className="bg-card border-hairline rounded-2xl p-5 mb-6 flex items-center justify-between">
        <div>
          <div className="text-sm font-medium text-[var(--foreground)]">Wunschliste teilen</div>
          {wishList?.isPublic && shareUrl ? (
            <div className="text-xs mt-0.5 truncate max-w-xs" style={{ color: "var(--muted-foreground)" }}>{shareUrl}</div>
          ) : (
            <div className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>Nicht öffentlich</div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {wishList?.isPublic && shareUrl && (
            <button
              onClick={() => navigator.clipboard.writeText(shareUrl)}
              className="text-xs px-3 py-1.5 border-hairline rounded-full hover:bg-[rgba(28,25,22,0.04)] transition-considered"
            >
              Link kopieren
            </button>
          )}
          <button
            onClick={togglePublic}
            className={`relative w-12 h-6 rounded-full transition-considered ${wishList?.isPublic ? "bg-[#c4704a]" : "bg-[rgba(28,25,22,0.15)]"}`}
          >
            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${wishList?.isPublic ? "translate-x-7" : "translate-x-1"}`} />
          </button>
        </div>
      </div>

      {/* Formular */}
      {showForm && (
        <form onSubmit={addItem} className="bg-card border-brass-hairline rounded-2xl p-6 mb-6 space-y-3">
          <h3 className="kicker">Neuer Wunsch</h3>
          <input type="text" placeholder="Was wünschst du dir? *" value={newItem.title} onChange={(e) => setNewItem({ ...newItem, title: e.target.value })} required className={inputClass} />
          <input type="url" placeholder="Link (optional)" value={newItem.url} onChange={(e) => setNewItem({ ...newItem, url: e.target.value })} className={inputClass} />
          <div className="flex gap-2">
            <input type="number" placeholder="Preis ab (€)" value={newItem.priceMin} onChange={(e) => setNewItem({ ...newItem, priceMin: e.target.value })} className={inputClass} />
            <input type="number" placeholder="Preis bis (€)" value={newItem.priceMax} onChange={(e) => setNewItem({ ...newItem, priceMax: e.target.value })} className={inputClass} />
          </div>
          <textarea placeholder="Beschreibung (optional)" value={newItem.description} onChange={(e) => setNewItem({ ...newItem, description: e.target.value })} rows={2} className={`${inputClass} resize-none`} />
          <div className="flex gap-2">
            <button type="submit" disabled={adding} className="flex-1 py-2.5 bg-[var(--foreground)] text-[var(--card)] rounded-full text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-considered">
              {adding ? "Wird hinzugefügt..." : "Hinzufügen"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2.5 border-hairline rounded-full text-sm transition-considered hover:bg-[rgba(28,25,22,0.04)]">
              Abbrechen
            </button>
          </div>
        </form>
      )}

      {/* Leer */}
      {wishList?.items.length === 0 && (
        <div className="text-center py-14" style={{ color: "var(--muted-foreground)" }}>
          <div className="font-serif text-4xl mb-3 opacity-30">✦</div>
          <p className="editorial-italic">Noch keine Wünsche eingetragen.</p>
        </div>
      )}

      <div className="space-y-3">
        {wishList?.items.map((item) => (
          <div
            key={item.id}
            className={`bg-card border-hairline rounded-xl p-4 ${item.status === "FULFILLED" ? "opacity-50" : ""}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className={`font-medium ${item.status === "FULFILLED" ? "line-through" : "text-[var(--foreground)]"}`}>
                  {item.title}
                </div>
                {item.description && <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>{item.description}</p>}
                <div className="flex items-center gap-3 mt-1.5">
                  {item.url && (
                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-xs text-[#c4704a] hover:underline">
                      Link öffnen →
                    </a>
                  )}
                  {(item.priceMin || item.priceMax) && (
                    <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                      {item.priceMin && `ab ${item.priceMin} €`}
                      {item.priceMin && item.priceMax && " · "}
                      {item.priceMax && `bis ${item.priceMax} €`}
                    </span>
                  )}
                  {item.status === "RESERVED" && (
                    <span className="text-xs bg-[#c4704a]/10 text-[#c4704a] px-2 py-0.5 rounded-full font-medium">
                      Reserviert
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-1.5 flex-shrink-0">
                {item.status === "OPEN" && (
                  <button onClick={() => markFulfilled(item.id)} className="text-xs px-2.5 py-1.5 border-hairline rounded-lg hover:bg-[rgba(28,25,22,0.04)] transition-considered" title="Als erfüllt markieren">
                    ✓
                  </button>
                )}
                <button onClick={() => deleteItem(item.id)} className="text-xs px-2.5 py-1.5 border border-red-100 text-red-400 rounded-lg hover:bg-red-50 transition-considered" title="Löschen">
                  ✕
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
