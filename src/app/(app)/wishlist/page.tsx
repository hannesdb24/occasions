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

  if (loading) return <div className="text-gray-400 py-16 text-center">Wird geladen...</div>;

  const appUrl = typeof window !== "undefined" ? window.location.origin : "";
  const shareUrl = wishList?.shareToken ? `${appUrl}/wishlist/${wishList.shareToken}` : null;

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Meine Wunschliste</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          + Wunsch hinzufügen
        </button>
      </div>

      {/* Öffentlich teilen */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6 flex items-center justify-between">
        <div>
          <div className="font-medium text-sm">Wunschliste teilen</div>
          {wishList?.isPublic && shareUrl ? (
            <div className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{shareUrl}</div>
          ) : (
            <div className="text-xs text-gray-400 mt-0.5">Nicht öffentlich</div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {wishList?.isPublic && shareUrl && (
            <button
              onClick={() => navigator.clipboard.writeText(shareUrl)}
              className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Link kopieren
            </button>
          )}
          <button
            onClick={togglePublic}
            className={`relative w-12 h-6 rounded-full transition-colors ${wishList?.isPublic ? "bg-indigo-600" : "bg-gray-200"}`}
          >
            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${wishList?.isPublic ? "translate-x-7" : "translate-x-1"}`} />
          </button>
        </div>
      </div>

      {/* Formular */}
      {showForm && (
        <form onSubmit={addItem} className="bg-white rounded-xl border border-indigo-100 p-5 mb-6 space-y-3">
          <h3 className="font-medium text-sm">Neuer Wunsch</h3>
          <input
            type="text"
            placeholder="Was wünschst du dir? *"
            value={newItem.title}
            onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
            required
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <input
            type="url"
            placeholder="Link (optional)"
            value={newItem.url}
            onChange={(e) => setNewItem({ ...newItem, url: e.target.value })}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Preis ab (€)"
              value={newItem.priceMin}
              onChange={(e) => setNewItem({ ...newItem, priceMin: e.target.value })}
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="number"
              placeholder="Preis bis (€)"
              value={newItem.priceMax}
              onChange={(e) => setNewItem({ ...newItem, priceMax: e.target.value })}
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <textarea
            placeholder="Beschreibung (optional)"
            value={newItem.description}
            onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
            rows={2}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={adding}
              className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {adding ? "Wird hinzugefügt..." : "Hinzufügen"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
            >
              Abbrechen
            </button>
          </div>
        </form>
      )}

      {/* Items */}
      {wishList?.items.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <div className="text-4xl mb-3">🎁</div>
          <p>Noch keine Wünsche eingetragen.</p>
        </div>
      )}

      <div className="space-y-3">
        {wishList?.items.map((item) => (
          <div
            key={item.id}
            className={`bg-white rounded-xl border p-4 ${item.status === "FULFILLED" ? "opacity-50 border-gray-100" : "border-gray-100"}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className={`font-medium ${item.status === "FULFILLED" ? "line-through text-gray-400" : "text-gray-900"}`}>
                  {item.title}
                </div>
                {item.description && <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>}
                <div className="flex items-center gap-3 mt-1.5">
                  {item.url && (
                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-500 hover:underline">
                      Link öffnen →
                    </a>
                  )}
                  {(item.priceMin || item.priceMax) && (
                    <span className="text-xs text-gray-400">
                      {item.priceMin && `ab ${item.priceMin} €`}
                      {item.priceMin && item.priceMax && " · "}
                      {item.priceMax && `bis ${item.priceMax} €`}
                    </span>
                  )}
                  {item.status === "RESERVED" && (
                    <span className="text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full font-medium">
                      Reserviert
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-1.5 flex-shrink-0">
                {item.status === "OPEN" && (
                  <button
                    onClick={() => markFulfilled(item.id)}
                    className="text-xs px-2.5 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    title="Als erfüllt markieren"
                  >
                    ✓
                  </button>
                )}
                <button
                  onClick={() => deleteItem(item.id)}
                  className="text-xs px-2.5 py-1.5 border border-red-100 text-red-400 rounded-lg hover:bg-red-50 transition-colors"
                  title="Löschen"
                >
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
