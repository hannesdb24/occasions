"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { RELATIONSHIP_TYPE_LABELS } from "@/types";

interface ContactLink {
  id: string;
  linkType: string;
  fromId: string;
  toId: string;
}

interface NetworkContact {
  id: string;
  name: string;
  category: string;
  relationshipType: string | null;
  linksFrom?: ContactLink[];
  linksTo?: ContactLink[];
}

const CATEGORY_CONFIG: Record<string, { color: string; lineColor: string; label: string }> = {
  PARTNER:    { color: "#B85968", lineColor: "#D4939E", label: "Partner" },
  FAMILY:     { color: "#A8895C", lineColor: "#C4A878", label: "Familie" },
  FRIENDS:    { color: "#5B7FA6", lineColor: "#8AAAC8", label: "Freunde" },
  COLLEAGUES: { color: "#6B8F6E", lineColor: "#95B498", label: "Kollegen" },
  OTHER:      { color: "#8B7B6B", lineColor: "#AE9E8E", label: "Sonstige" },
};

const CATEGORY_ORDER = ["PARTNER", "FAMILY", "FRIENDS", "COLLEAGUES", "OTHER"];

function radialTextAnchor(angle: number): "start" | "middle" | "end" {
  const cos = Math.cos(angle);
  if (cos > 0.25) return "start";
  if (cos < -0.25) return "end";
  return "middle";
}

export function ContactNetwork({
  contacts,
  userName,
}: {
  contacts: NetworkContact[];
  userName: string;
}) {
  const router = useRouter();
  const [hovered, setHovered] = useState<string | null>(null);

  const W = 720, H = 580;
  const cx = W / 2, cy = H / 2 + 10;
  const R = 200;
  const nodeR = 26;
  const centerR = 40;
  const labelOffset = nodeR + 18;

  const positions = useMemo(() => {
    const groups = CATEGORY_ORDER
      .map((cat) => ({ cat, items: contacts.filter((c) => c.category === cat) }))
      .filter((g) => g.items.length > 0);

    const total = contacts.length;
    if (total === 0) return [];

    const GAP = Math.min(10, 360 / Math.max(groups.length, 1) / 4);
    const totalGap = groups.length * GAP;
    const available = 360 - totalGap;

    const result: Array<{
      contact: NetworkContact;
      x: number;
      y: number;
      angle: number;
      cat: string;
    }> = [];

    let currentAngle = -90;

    for (const group of groups) {
      const sector = (group.items.length / total) * available;
      const anglePerItem = sector / group.items.length;

      group.items.forEach((contact, i) => {
        const a = currentAngle + anglePerItem * (i + 0.5);
        const rad = (a * Math.PI) / 180;
        result.push({
          contact,
          x: cx + R * Math.cos(rad),
          y: cy + R * Math.sin(rad),
          angle: rad,
          cat: group.cat,
        });
      });

      currentAngle += sector + GAP;
    }

    return result;
  }, [contacts, cx, cy]);

  const initial = userName.charAt(0).toUpperCase();
  const activeCats = CATEGORY_ORDER.filter((cat) =>
    contacts.some((c) => c.category === cat)
  );

  if (contacts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="font-serif text-xl font-medium text-[var(--foreground)] mb-2">Noch niemanden hinzugefügt</p>
        <p className="text-sm editorial-italic">Füge deine erste Person hinzu, um das Netzwerk zu sehen.</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto select-none"
        style={{ maxHeight: 580 }}
        aria-label="Kontakt-Netzwerk"
      >
        {/* Kontakt-zu-Kontakt-Verbindungen */}
        {(() => {
          const drawn = new Set<string>();
          const lines: React.ReactNode[] = [];
          const LINK_COLORS: Record<string, { stroke: string; dash?: string; width: number }> = {
            COUPLE:    { stroke: "#B85968", width: 2.5 },
            PARENT_OF: { stroke: "#A8895C", width: 2, dash: "6 3" },
            SIBLINGS:  { stroke: "#5B7FA6", width: 2, dash: "4 4" },
            OTHER:     { stroke: "#8B7B6B", width: 1.5, dash: "3 5" },
          };
          for (const { contact, x, y } of positions) {
            const allLinks = [...(contact.linksFrom ?? []), ...(contact.linksTo ?? [])];
            for (const link of allLinks) {
              if (drawn.has(link.id)) continue;
              drawn.add(link.id);
              const otherId = link.fromId === contact.id ? link.toId : link.fromId;
              const target = positions.find((p) => p.contact.id === otherId);
              if (!target) continue;
              const cfg = LINK_COLORS[link.linkType] ?? LINK_COLORS.OTHER;
              lines.push(
                <line
                  key={`clink-${link.id}`}
                  x1={x} y1={y} x2={target.x} y2={target.y}
                  stroke={cfg.stroke}
                  strokeWidth={cfg.width}
                  strokeOpacity={0.55}
                  strokeDasharray={cfg.dash}
                />
              );
            }
          }
          return lines;
        })()}

        {/* Verbindungslinien zur Mitte */}
        {positions.map(({ contact, x, y, cat }) => {
          const cfg = CATEGORY_CONFIG[cat] ?? CATEGORY_CONFIG.OTHER;
          const isHov = hovered === contact.id;
          return (
            <line
              key={`line-${contact.id}`}
              x1={cx} y1={cy}
              x2={x} y2={y}
              stroke={cfg.lineColor}
              strokeWidth={isHov ? 2.5 : 1.5}
              strokeOpacity={isHov ? 0.9 : 0.35}
              style={{ transition: "stroke-opacity 0.15s, stroke-width 0.15s" }}
            />
          );
        })}

        {/* Mittelpunkt — Ich */}
        <circle cx={cx} cy={cy} r={centerR} fill="#1c1916" />
        <circle cx={cx} cy={cy} r={centerR - 1} fill="none" stroke="#c4704a" strokeWidth={1.5} strokeOpacity={0.5} />
        <text
          x={cx} y={cy - 4}
          textAnchor="middle"
          fill="white"
          fontSize={16}
          fontFamily="Georgia, serif"
          fontWeight="500"
        >
          {initial}
        </text>
        <text
          x={cx} y={cy + 11}
          textAnchor="middle"
          fill="rgba(255,255,255,0.55)"
          fontSize={9}
          fontFamily="sans-serif"
          letterSpacing="0.08em"
        >
          ICH
        </text>

        {/* Kontakt-Knoten */}
        {positions.map(({ contact, x, y, angle, cat }) => {
          const cfg = CATEGORY_CONFIG[cat] ?? CATEGORY_CONFIG.OTHER;
          const isHov = hovered === contact.id;
          const nodeInitial = contact.name.charAt(0).toUpperCase();
          const firstName = contact.name.split(" ")[0];
          const labelX = x + Math.cos(angle) * labelOffset;
          const labelY = y + Math.sin(angle) * labelOffset;
          const anchor = radialTextAnchor(angle);
          const relLabel = contact.relationshipType
            ? RELATIONSHIP_TYPE_LABELS[contact.relationshipType]
            : null;

          return (
            <g
              key={contact.id}
              style={{ cursor: "pointer" }}
              onMouseEnter={() => setHovered(contact.id)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => router.push(`/contacts/${contact.id}`)}
            >
              {/* Glowing ring on hover */}
              {isHov && (
                <circle
                  cx={x} cy={y}
                  r={nodeR + 6}
                  fill={cfg.color}
                  opacity={0.15}
                />
              )}
              <circle
                cx={x} cy={y}
                r={isHov ? nodeR + 2 : nodeR}
                fill={cfg.color}
                opacity={isHov ? 1 : 0.82}
                style={{ transition: "all 0.15s" }}
              />
              <text
                x={x} y={y + 5}
                textAnchor="middle"
                fill="white"
                fontSize={14}
                fontFamily="Georgia, serif"
                fontWeight="500"
                style={{ pointerEvents: "none" }}
              >
                {nodeInitial}
              </text>

              {/* Name-Label */}
              <text
                x={labelX} y={labelY}
                textAnchor={anchor}
                fill="#1c1916"
                fontSize={11}
                fontFamily="sans-serif"
                fontWeight={isHov ? "600" : "400"}
                style={{ pointerEvents: "none", transition: "font-weight 0.1s" }}
              >
                {firstName}
              </text>

              {/* Tooltip bei Hover */}
              {isHov && relLabel && (
                <g style={{ pointerEvents: "none" }}>
                  <rect
                    x={x - 48} y={y - nodeR - 38}
                    width={96} height={26}
                    rx={13}
                    fill="#1c1916"
                  />
                  <text
                    x={x} y={y - nodeR - 21}
                    textAnchor="middle"
                    fill="white"
                    fontSize={10}
                    fontFamily="sans-serif"
                  >
                    {relLabel}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>

      {/* Legende */}
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-2 pb-2">
        {activeCats.map((cat) => {
          const cfg = CATEGORY_CONFIG[cat];
          return (
            <div key={cat} className="flex items-center gap-1.5">
              <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cfg.color }} />
              <span className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>{cfg.label}</span>
            </div>
          );
        })}
        <div className="w-full" />
        {[
          { color: "#B85968", label: "Paar", dash: false },
          { color: "#A8895C", label: "Elternteil von", dash: true },
          { color: "#5B7FA6", label: "Geschwister", dash: true },
        ].map(({ color, label, dash }) => (
          <div key={label} className="flex items-center gap-1.5">
            <svg width="18" height="8" viewBox="0 0 18 8">
              <line x1="0" y1="4" x2="18" y2="4" stroke={color} strokeWidth="2" strokeDasharray={dash ? "4 3" : undefined} />
            </svg>
            <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
