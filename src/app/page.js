"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import styles from "./page.module.css";

/* ─── helpers ─── */
function computePotential(p) {
  const base =
    p.previous_rating && p.previous_rating.length > 0
      ? p.previous_rating[p.previous_rating.length - 1]
      : 1;
  return +(base + (p.rating_diff || 0)).toFixed(2);
}

function fmtValue(n) {
  if (!n) return "—";
  if (n >= 1e12) return (n / 1e12).toFixed(1) + "T";
  if (n >= 1e9) return (n / 1e9).toFixed(1) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(0) + "K";
  return n;
}

function fmtSalary(n) {
  if (!n) return "—";
  return "$" + fmtValue(n);
}

const MINDSETS = ["Defensive", "Balanced", "Attacking"];
const FORMATIONS = ["4-4-2", "4-3-3", "4-2-3-1", "3-5-2", "5-3-2", "4-1-4-1"];

const ZONE_COLOR = {
  DEF: { bg: "#0d2a4a", text: "#448aff", border: "#1a3d6b" },
  MID: { bg: "#2a1a4a", text: "#b388ff", border: "#3d2870" },
  OFF: { bg: "#4a1a0d", text: "#ff8a65", border: "#6b2a1a" },
  GK:  { bg: "#0d3a1a", text: "#00e676", border: "#1a5c2a" },
};

const SORT_OPTIONS = [
  { key: "potential",           label: "Potential" },
  { key: "rating_diff",         label: "Rating diff" },
  { key: "age",                 label: "Age" },
  { key: "market_value",        label: "Market value" },
  { key: "salary",              label: "Salary" },
  { key: "goals_scored",        label: "Goals" },
  { key: "assists",             label: "Assists" },
  { key: "played_matches_total",label: "Matches" },
];

/* ─── sub-components ─── */
function StatCard({ label, value, accent }) {
  return (
    <div className={styles.statCard}>
      <div className={styles.statLabel}>{label}</div>
      <div className={styles.statValue} style={accent ? { color: "var(--accent)" } : {}}>
        {value}
      </div>
    </div>
  );
}

function PotBar({ value, max }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  const color =
    pct >= 80 ? "var(--accent)" : pct >= 50 ? "var(--amber)" : "var(--text3)";
  return (
    <div className={styles.potBarWrap}>
      <div className={styles.potBarBg}>
        <div className={styles.potBarFill} style={{ width: pct + "%", background: color }} />
      </div>
    </div>
  );
}

function PlayerCard({ player, maxPot, onClick }) {
  const zone = player.fav_zone || "MID";
  const zc = ZONE_COLOR[zone] || ZONE_COLOR.MID;
  const name = player.nick_name || `${player.first_name} ${player.last_name}`;
  return (
    <div className={styles.playerCard} onClick={() => onClick(player)}>
      <div className={styles.cardTop}>
        <span
          className={styles.zoneBadge}
          style={{ background: zc.bg, color: zc.text, border: `1px solid ${zc.border}` }}
        >
          {player.fav_position}
        </span>
        {player.academy?.status === 1 && (
          <span className={styles.acadBadge}>academy</span>
        )}
      </div>
      <div className={styles.playerName} title={`${player.first_name} ${player.last_name}`}>
        {name}
      </div>
      <div className={styles.playerSub}>
        {zone} · Age {player.age}
      </div>

      <div className={styles.cardMetrics}>
        <div className={styles.cardMetric}>
          <span className={styles.cmLabel}>Potential</span>
          <span className={styles.cmValue} style={{ color: "var(--accent)" }}>
            {player._potential.toFixed(2)}
          </span>
        </div>
        <div className={styles.cardMetric}>
          <span className={styles.cmLabel}>Diff</span>
          <span className={styles.cmValue} style={{ color: player.rating_diff > 0 ? "var(--amber)" : "var(--text2)" }}>
            +{(player.rating_diff || 0).toFixed(1)}
          </span>
        </div>
        <div className={styles.cardMetric}>
          <span className={styles.cmLabel}>Value</span>
          <span className={styles.cmValue}>{fmtValue(player.market_value)}</span>
        </div>
        <div className={styles.cardMetric}>
          <span className={styles.cmLabel}>Salary</span>
          <span className={styles.cmValue}>{fmtSalary(player.salary)}</span>
        </div>
      </div>

      <PotBar value={player._potential} max={maxPot} />
    </div>
  );
}

function PlayerModal({ player, onClose }) {
  if (!player) return null;
  const zone = player.fav_zone || "MID";
  const zc = ZONE_COLOR[zone] || ZONE_COLOR.MID;

  const rows = [
    ["Position", player.fav_position],
    ["2nd position", player.second_fav_position || "—"],
    ["Zone", player.fav_zone],
    ["Age", player.age],
    ["League", player.league?.name || "—"],
    ["Academy", player.academy?.team?.name || "—"],
    ["Potential", player._potential.toFixed(2)],
    ["Rating diff", `+${(player.rating_diff || 0).toFixed(2)}`],
    ["Market value", fmtValue(player.market_value)],
    ["Salary", fmtSalary(player.salary)],
    ["Goals", player.goals_scored || 0],
    ["Assists", player.assists || 0],
    ["Matches (season)", player.played_matches || 0],
    ["Matches (total)", player.played_matches_total || 0],
    ["Form range", player.form_range],
    ["Fav mindset", MINDSETS[player.fav_mindset] ?? player.fav_mindset],
    ["Worst mindset", MINDSETS[player.worst_mindset] ?? player.worst_mindset],
    ["Fav formation", FORMATIONS[player.fav_formation] ?? player.fav_formation],
    ["Best vs", player.fav_opponent || "—"],
    ["Worst vs", player.worst_opponent || "—"],
    ["Boost", player.boost_enabled ? "On" : "Off"],
    ["Decline", player.decline_enabled ? "On" : "Off"],
  ];

  return (
    <div className={styles.modalBackdrop} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <button className={styles.modalClose} onClick={onClose}>✕</button>
        <div className={styles.modalHeader}>
          <div
            className={styles.modalZoneDot}
            style={{ background: zc.bg, border: `1px solid ${zc.border}` }}
          >
            <span style={{ color: zc.text, fontSize: 11, fontWeight: 600 }}>
              {player.fav_position}
            </span>
          </div>
          <div>
            <div className={styles.modalName}>
              {player.first_name} {player.last_name}
            </div>
            {player.nick_name && (
              <div className={styles.modalNick}>"{player.nick_name}"</div>
            )}
          </div>
        </div>

        <div className={styles.modalPotRow}>
          <span className={styles.modalPotLabel}>Potential</span>
          <span className={styles.modalPotValue}>{player._potential.toFixed(2)}</span>
        </div>

        <div className={styles.modalGrid}>
          {rows.map(([label, value]) => (
            <div key={label} className={styles.modalRow}>
              <span className={styles.modalRowLabel}>{label}</span>
              <span className={styles.modalRowValue}>{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── main page ─── */
export default function Page() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);

  const [search, setSearch] = useState("");
  const [zoneFilter, setZoneFilter] = useState("");
  const [posFilter, setPosFilter] = useState("");
  const [ageMax, setAgeMax] = useState(40);
  const [minPot, setMinPot] = useState(0);
  const [academyOnly, setAcademyOnly] = useState(false);
  const [sortKey, setSortKey] = useState("potential");
  const [sortDir, setSortDir] = useState(-1);

  useEffect(() => {
    fetch("/api/players")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setError(data.error); setLoading(false); return; }
        const raw = Array.isArray(data) ? data : data.players || [];
        setPlayers(raw.map((p) => ({ ...p, _potential: computePotential(p) })));
        setLoading(false);
      })
      .catch((e) => { setError(String(e)); setLoading(false); });
  }, []);

  const positions = useMemo(
    () => [...new Set(players.map((p) => p.fav_position))].sort(),
    [players]
  );

  const filtered = useMemo(() => {
    let list = players.filter((p) => {
      const name = `${p.first_name} ${p.last_name} ${p.nick_name || ""}`.toLowerCase();
      if (search && !name.includes(search.toLowerCase())) return false;
      if (zoneFilter && p.fav_zone !== zoneFilter) return false;
      if (posFilter && p.fav_position !== posFilter) return false;
      if (p.age > ageMax) return false;
      if (p._potential < minPot) return false;
      if (academyOnly && p.academy?.status !== 1) return false;
      return true;
    });

    list.sort((a, b) => {
      const av = sortKey === "potential" ? a._potential : a[sortKey] ?? 0;
      const bv = sortKey === "potential" ? b._potential : b[sortKey] ?? 0;
      return (av - bv) * sortDir;
    });

    return list;
  }, [players, search, zoneFilter, posFilter, ageMax, minPot, academyOnly, sortKey, sortDir]);

  const maxPot = useMemo(
    () => Math.max(...players.map((p) => p._potential), 1),
    [players]
  );

  const handleSort = useCallback(
    (key) => {
      if (sortKey === key) setSortDir((d) => d * -1);
      else { setSortKey(key); setSortDir(-1); }
    },
    [sortKey]
  );

  const avgAge = filtered.length
    ? (filtered.reduce((s, p) => s + p.age, 0) / filtered.length).toFixed(1)
    : "—";
  const avgPot = filtered.length
    ? (filtered.reduce((s, p) => s + p._potential, 0) / filtered.length).toFixed(2)
    : "—";
  const inAcad = filtered.filter((p) => p.academy?.status === 1).length;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>
            <span className={styles.titleAccent}>◆</span> Scout Dashboard
          </h1>
          <p className={styles.subtitle}>The Open League · player potential & analysis</p>
        </div>
        <div className={styles.headerRight}>
          <span className={styles.liveTag}>● LIVE</span>
        </div>
      </header>

      {loading && (
        <div className={styles.statusMsg}>Loading players…</div>
      )}
      {error && (
        <div className={styles.errorMsg}>
          <strong>Error:</strong> {error}
          <div style={{ marginTop: 8, fontSize: 12, opacity: 0.8 }}>
            Make sure OPEN_LEAGUE_COOKIE is set in your Vercel environment variables.
          </div>
        </div>
      )}

      {!loading && !error && (
        <>
          <div className={styles.statsRow}>
            <StatCard label="Players" value={filtered.length} />
            <StatCard label="Avg age" value={avgAge} />
            <StatCard label="Avg potential" value={avgPot} accent />
            <StatCard label="In academy" value={inAcad} />
          </div>

          <div className={styles.filterBar}>
            <input
              className={styles.searchInput}
              type="text"
              placeholder="Search name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select className={styles.select} value={zoneFilter} onChange={(e) => setZoneFilter(e.target.value)}>
              <option value="">All zones</option>
              {["DEF", "MID", "OFF", "GK"].map((z) => <option key={z}>{z}</option>)}
            </select>
            <select className={styles.select} value={posFilter} onChange={(e) => setPosFilter(e.target.value)}>
              <option value="">All positions</option>
              {positions.map((p) => <option key={p}>{p}</option>)}
            </select>
            <label className={styles.filterLabel}>
              Max age
              <input
                className={styles.numInput}
                type="number" min={13} max={50}
                value={ageMax}
                onChange={(e) => setAgeMax(+e.target.value)}
              />
            </label>
            <label className={styles.filterLabel}>
              Min potential
              <input
                className={styles.numInput}
                type="number" min={0} max={20} step={0.5}
                value={minPot}
                onChange={(e) => setMinPot(+e.target.value)}
              />
            </label>
            <label className={styles.checkLabel}>
              <input type="checkbox" checked={academyOnly} onChange={(e) => setAcademyOnly(e.target.checked)} />
              Academy only
            </label>
          </div>

          <div className={styles.sortBar}>
            <span className={styles.sortLabel}>Sort:</span>
            {SORT_OPTIONS.map(({ key, label }) => (
              <button
                key={key}
                className={`${styles.sortBtn} ${sortKey === key ? styles.sortBtnActive : ""}`}
                onClick={() => handleSort(key)}
              >
                {label}
                {sortKey === key && (
                  <span className={styles.sortArrow}>{sortDir === -1 ? "↓" : "↑"}</span>
                )}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className={styles.empty}>No players match your filters.</div>
          ) : (
            <div className={styles.grid}>
              {filtered.map((p) => (
                <PlayerCard
                  key={p._id}
                  player={p}
                  maxPot={maxPot}
                  onClick={setSelected}
                />
              ))}
            </div>
          )}
        </>
      )}

      <PlayerModal player={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
