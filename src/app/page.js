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
  return String(n);
}

const MINDSETS = ["Defensive", "Balanced", "Attacking"];
const FORMATIONS = ["4-4-2", "4-3-3", "4-2-3-1", "3-5-2", "5-3-2", "4-1-4-1"];

const ZONE_COLORS = {
  DEF: "#448aff",
  MID: "#b388ff",
  OFF: "#ff8a65",
  GK:  "#00e676",
};

const COLUMNS = [
  { key: "name",                 label: "Name",      sortKey: "last_name",           width: "180px" },
  { key: "fav_position",         label: "Pos",       sortKey: "fav_position",        width: "60px"  },
  { key: "fav_zone",             label: "Zone",      sortKey: "fav_zone",            width: "55px"  },
  { key: "age",                  label: "Age",       sortKey: "age",                 width: "50px"  },
  { key: "potential",            label: "Potential", sortKey: "potential",           width: "80px"  },
  { key: "market_value",         label: "Value",     sortKey: "market_value",        width: "80px"  },
  { key: "salary",               label: "Salary",    sortKey: "salary",              width: "70px"  },
  { key: "goals_scored",         label: "G",         sortKey: "goals_scored",        width: "40px"  },
  { key: "assists",              label: "A",         sortKey: "assists",             width: "40px"  },
  { key: "played_matches_total", label: "Apps",      sortKey: "played_matches_total",width: "50px"  },
  { key: "fav_opponent",         label: "Best vs",   sortKey: "fav_opponent",        width: "70px"  },
  { key: "worst_opponent",       label: "Weak vs",   sortKey: "worst_opponent",      width: "70px"  },
  { key: "academy",              label: "Academy",   sortKey: null,                  width: "140px" },
];

/* ─── side drawer ─── */
function PlayerDrawer({ player, onClose }) {
  if (!player) return null;

  const rows = [
    ["Full name",      `${player.first_name} ${player.last_name}`],
    ["Nick name",      player.nick_name || "—"],
    ["Position",       player.fav_position],
    ["2nd position",   player.second_fav_position || "—"],
    ["Zone",           player.fav_zone],
    ["Age",            player.age],
    ["League",         player.league?.name || "—"],
    ["Academy",        player.academy?.team?.name || "—"],
    ["Potential",      player._potential.toFixed(2)],
    ["Rating diff",    `+${(player.rating_diff || 0).toFixed(2)}`],
    ["Market value",   fmtValue(player.market_value)],
    ["Salary",         "$" + fmtValue(player.salary)],
    ["Goals",          player.goals_scored || 0],
    ["Assists",        player.assists || 0],
    ["Matches (ssn)",  player.played_matches || 0],
    ["Matches (all)",  player.played_matches_total || 0],
    ["Fav mindset",    MINDSETS[player.fav_mindset] ?? player.fav_mindset],
    ["Worst mindset",  MINDSETS[player.worst_mindset] ?? player.worst_mindset],
    ["Fav formation",  FORMATIONS[player.fav_formation] ?? player.fav_formation],
    ["Best vs",        player.fav_opponent || "—"],
    ["Worst vs",       player.worst_opponent || "—"],
    ["Form range",     player.form_range],
    ["Boost",          player.boost_enabled ? "On" : "Off"],
    ["Decline",        player.decline_enabled ? "On" : "Off"],
    ["Life stage",     player.life_stage],
  ];

  return (
    <div className={styles.drawer}>
      <div className={styles.drawerHeader}>
        <div>
          <div className={styles.drawerName}>{player.first_name} {player.last_name}</div>
          <div className={styles.drawerSub}>
            <span style={{ color: ZONE_COLORS[player.fav_zone] || "#aaa" }}>{player.fav_position}</span>
            {" · "}{player.fav_zone}{" · "}Age {player.age}
          </div>
        </div>
        <button className={styles.drawerClose} onClick={onClose}>✕</button>
      </div>

      <div className={styles.drawerPot}>
        <span className={styles.drawerPotLabel}>Potential</span>
        <span className={styles.drawerPotValue}>{player._potential.toFixed(2)}</span>
      </div>

      <div className={styles.drawerRows}>
        {rows.map(([label, value]) => (
          <div key={label} className={styles.drawerRow}>
            <span className={styles.drawerRowLabel}>{label}</span>
            <span className={styles.drawerRowValue}>{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── main page ─── */
export default function Page() {
  const [players, setPlayers]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [selected, setSelected] = useState(null);

  const [search,      setSearch]      = useState("");
  const [zoneFilter,  setZoneFilter]  = useState("");
  const [posFilter,   setPosFilter]   = useState("");
  const [ageMax,      setAgeMax]      = useState(40);
  const [minPot,      setMinPot]      = useState(0);
  const [academyOnly, setAcademyOnly] = useState(false);
  const [sortKey,     setSortKey]     = useState("potential");
  const [sortDir,     setSortDir]     = useState(-1);

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
      if (search      && !name.includes(search.toLowerCase()))  return false;
      if (zoneFilter  && p.fav_zone !== zoneFilter)             return false;
      if (posFilter   && p.fav_position !== posFilter)          return false;
      if (p.age > ageMax)                                        return false;
      if (p._potential < minPot)                                 return false;
      if (academyOnly && p.academy?.status !== 1)               return false;
      return true;
    });

    list.sort((a, b) => {
      const av = sortKey === "potential" ? a._potential : (a[sortKey] ?? "");
      const bv = sortKey === "potential" ? b._potential : (b[sortKey] ?? "");
      if (typeof av === "string") return av.localeCompare(bv) * sortDir;
      return (av - bv) * sortDir;
    });

    return list;
  }, [players, search, zoneFilter, posFilter, ageMax, minPot, academyOnly, sortKey, sortDir]);

  const handleSort = useCallback((key) => {
    if (!key) return;
    if (sortKey === key) setSortDir((d) => d * -1);
    else { setSortKey(key); setSortDir(-1); }
  }, [sortKey]);

  const avgPot = filtered.length
    ? (filtered.reduce((s, p) => s + p._potential, 0) / filtered.length).toFixed(2)
    : "—";

  function cellValue(col, p) {
    switch (col.key) {
      case "name":
        return (
          <span className={styles.nameCell}>
            {p.first_name} {p.last_name}
            {p.nick_name && <span className={styles.nick}> "{p.nick_name}"</span>}
          </span>
        );
      case "fav_zone":
        return <span style={{ color: ZONE_COLORS[p.fav_zone] || "inherit" }}>{p.fav_zone}</span>;
      case "fav_position":
        return <span style={{ color: ZONE_COLORS[p.fav_zone] || "inherit", fontWeight: 500 }}>{p.fav_position}</span>;
      case "potential":
        return <span className={styles.potCell}>{p._potential.toFixed(2)}</span>;
      case "rating_diff":
        return (
          <span style={{ color: p.rating_diff > 0 ? "#ffb300" : "var(--text3)" }}>
            {p.rating_diff > 0 ? "+" : ""}{(p.rating_diff || 0).toFixed(1)}
          </span>
        );
      case "market_value":  return fmtValue(p.market_value);
      case "salary":        return "$" + fmtValue(p.salary);
      case "academy":
        return p.academy?.team?.name
          ? <span className={styles.acadTag}>{p.academy.team.name}</span>
          : <span className={styles.dimCell}>—</span>;
      case "goals_scored":
        return p.goals_scored > 0 ? p.goals_scored : <span className={styles.dimCell}>0</span>;
      case "assists":
        return p.assists > 0 ? p.assists : <span className={styles.dimCell}>0</span>;
      case "played_matches_total":
        return p.played_matches_total > 0 ? p.played_matches_total : <span className={styles.dimCell}>0</span>;
      default:
        return p[col.key] ?? <span className={styles.dimCell}>—</span>;
    }
  }

  const hasDrawer = !!selected;

  return (
    <div className={`${styles.layout} ${hasDrawer ? styles.layoutDrawerOpen : ""}`}>
      <div className={styles.main}>
        <header className={styles.header}>
          <h1 className={styles.title}>
            Open League <span className={styles.titleDim}>/ Scout</span>
          </h1>
          <div className={styles.headerMeta}>
            <span>{filtered.length} players</span>
            <span className={styles.metaSep}>·</span>
            <span>avg potential <strong style={{ color: "#00e676" }}>{avgPot}</strong></span>
            <span className={styles.metaSep}>·</span>
            <span className={styles.liveTag}>● live</span>
          </div>
        </header>

        <div className={styles.filterBar}>
          <input
            className={styles.searchInput}
            type="text"
            placeholder="Search player…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select className={styles.select} value={zoneFilter} onChange={(e) => setZoneFilter(e.target.value)}>
            <option value="">All zones</option>
            {["DEF", "MID", "OFF", "GK"].map((z) => <option key={z}>{z}</option>)}
          </select>
          <select className={styles.select} value={posFilter} onChange={(e) => setPosFilter(e.target.value)}>
            <option value="">All positions</option>
            {positions.map((pos) => <option key={pos}>{pos}</option>)}
          </select>
          <label className={styles.filterLabel}>
            Max age
            <input className={styles.numInput} type="number" min={13} max={50} value={ageMax}
              onChange={(e) => setAgeMax(+e.target.value)} />
          </label>
          <label className={styles.filterLabel}>
            Min potential
            <input className={styles.numInput} type="number" min={0} max={20} step={0.5} value={minPot}
              onChange={(e) => setMinPot(+e.target.value)} />
          </label>
          <label className={styles.checkLabel}>
            <input type="checkbox" checked={academyOnly} onChange={(e) => setAcademyOnly(e.target.checked)} />
            Academy only
          </label>
        </div>

        {loading && <div className={styles.statusMsg}>Loading players…</div>}
        {error   && <div className={styles.errorMsg}><strong>Error:</strong> {error}</div>}

        {!loading && !error && (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  {COLUMNS.map((col) => (
                    <th
                      key={col.key}
                      className={[
                        styles.th,
                        col.sortKey ? styles.thSortable : "",
                        sortKey === col.sortKey ? styles.thActive : "",
                      ].join(" ")}
                      style={{ width: col.width, minWidth: col.width }}
                      onClick={() => handleSort(col.sortKey)}
                    >
                      {col.label}
                      {col.sortKey && sortKey === col.sortKey && (
                        <span className={styles.sortArrow}>{sortDir === -1 ? " ↓" : " ↑"}</span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={COLUMNS.length} className={styles.emptyRow}>
                      No players match these filters.
                    </td>
                  </tr>
                ) : (
                  filtered.map((p) => (
                    <tr
                      key={p._id}
                      className={`${styles.tr} ${selected?._id === p._id ? styles.trSelected : ""}`}
                      onClick={() => setSelected(selected?._id === p._id ? null : p)}
                    >
                      {COLUMNS.map((col) => (
                        <td key={col.key} className={styles.td}>
                          {cellValue(col, p)}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {hasDrawer && <PlayerDrawer player={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}