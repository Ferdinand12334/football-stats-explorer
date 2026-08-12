import { useState, useMemo } from 'react';
import players from './players.json';
import './App.css';

const STAT_COLUMNS = [
  { key: 'Goals', label: 'Goals' },
  { key: 'Assists', label: 'Assists' },
  { key: 'Shots', label: 'Shots' },
  { key: 'SoT', label: 'On Target' },
  { key: 'TklW', label: 'Tackles Won' },
  { key: 'Int', label: 'Interceptions' },
  { key: 'Crs', label: 'Crosses' },
  { key: 'Fld', label: 'Fouls Drawn' },
  { key: 'MP', label: 'Apps' },
  { key: 'Min', label: 'Minutes' },
  { key: 'Age', label: 'Age' },
];

function uniqueSorted(arr) {
  return [...new Set(arr)].filter(Boolean).sort();
}

// Position badge coloring is semantic: it encodes role on the pitch,
// grouped by the first position listed for players who play multiple.
function positionGroup(pos) {
  if (!pos) return 'unknown';
  const p = pos.slice(0, 2);
  if (p === 'GK') return 'gk';
  if (p === 'DF') return 'df';
  if (p === 'MF') return 'mf';
  if (p === 'FW') return 'fw';
  return 'unknown';
}

export default function App() {
  const [search, setSearch] = useState('');
  const [league, setLeague] = useState('All');
  const [position, setPosition] = useState('All');
  const [sortKey, setSortKey] = useState('Goals');
  const [sortDir, setSortDir] = useState('desc');
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [compareList, setCompareList] = useState([]);
  const [showCompare, setShowCompare] = useState(false);

  const leagues = useMemo(() => uniqueSorted(players.map(p => p.Comp)), []);
  const positions = useMemo(() => uniqueSorted(players.map(p => p.Pos)), []);

  const filtered = useMemo(() => {
    let result = players;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        p =>
          p.Player.toLowerCase().includes(q) ||
          p.Squad.toLowerCase().includes(q) ||
          p.Nation.toLowerCase().includes(q)
      );
    }
    if (league !== 'All') result = result.filter(p => p.Comp === league);
    if (position !== 'All') result = result.filter(p => p.Pos === position);

    result = [...result].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === 'string') {
        return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      return sortDir === 'asc' ? av - bv : bv - av;
    });

    return result;
  }, [search, league, position, sortKey, sortDir]);

  const handleSort = key => {
    if (sortKey === key) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const toggleCompare = (player, e) => {
    e.stopPropagation();
    setCompareList(list => {
      const already = list.find(p => p.Player === player.Player && p.Squad === player.Squad);
      if (already) return list.filter(p => p !== already);
      if (list.length >= 2) return [list[1], player]; // keep most recent 2
      return [...list, player];
    });
  };

  const isComparing = player =>
    compareList.some(p => p.Player === player.Player && p.Squad === player.Squad);

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <img src="/logo.png" alt="CLARCK logo" className="brand-logo" />
          <span className="eyebrow">Matchday Data Programme</span>
          <h1>Football Stats Explorer</h1>
          <p className="subtitle">2025–26 Season · Premier League · La Liga · Bundesliga · Serie A · Ligue 1</p>
          <div className="header-stats">
            <div className="header-stat">
              <span className="header-stat-value">{players.length.toLocaleString()}</span>
              <span className="header-stat-label">Players</span>
            </div>
            <div className="header-stat">
              <span className="header-stat-value">5</span>
              <span className="header-stat-label">Leagues</span>
            </div>
            <div className="header-stat">
              <span className="header-stat-value">25/26</span>
              <span className="header-stat-label">Season</span>
            </div>
          </div>
        </div>
      </header>

      <div className="controls">
        <input
          className="search"
          type="text"
          placeholder="Search player, club, or nation..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select value={league} onChange={e => setLeague(e.target.value)}>
          <option value="All">All Leagues</option>
          {leagues.map(l => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>
        <select value={position} onChange={e => setPosition(e.target.value)}>
          <option value="All">All Positions</option>
          {positions.map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      <p className="result-count">{filtered.length.toLocaleString()} players found</p>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th className="checkbox-col"></th>
              <th className="sticky-col" onClick={() => handleSort('Player')}>
                Player {sortKey === 'Player' && (sortDir === 'asc' ? '▲' : '▼')}
              </th>
              <th>Club</th>
              <th>League</th>
              <th>Pos</th>
              {STAT_COLUMNS.map(col => (
                <th key={col.key} onClick={() => handleSort(col.key)}>
                  {col.label} {sortKey === col.key && (sortDir === 'asc' ? '▲' : '▼')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, 200).map((p, i) => (
              <tr key={i} onClick={() => setSelectedPlayer(p)} className="row">
                <td className="checkbox-col" onClick={e => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={isComparing(p)}
                    onChange={e => toggleCompare(p, e)}
                    aria-label={`Compare ${p.Player}`}
                  />
                </td>
                <td className="sticky-col player-name">{p.Player}</td>
                <td>{p.Squad}</td>
                <td>{p.Comp}</td>
                <td><span className={`pos-badge pos-${positionGroup(p.Pos)}`}>{p.Pos}</span></td>
                {STAT_COLUMNS.map(col => (
                  <td key={col.key}>{p[col.key]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length > 200 && (
          <p className="truncated-note">Showing first 200 of {filtered.length.toLocaleString()} — narrow your search to see more.</p>
        )}
      </div>

      <footer className="footer">
        Built by <span className="footer-name">CLARCK</span> · Data: FBref, 2025–26 season
      </footer>

      {compareList.length > 0 && !showCompare && (
        <div className="compare-bar">
          <div className="compare-bar-names">
            {compareList.map(p => (
              <span key={p.Player} className="compare-chip">
                {p.Player}
                <button onClick={() => setCompareList(list => list.filter(x => x !== p))}>✕</button>
              </span>
            ))}
            {compareList.length < 2 && <span className="compare-hint">Select {2 - compareList.length} more player{2 - compareList.length > 1 ? 's' : ''} to compare</span>}
          </div>
          {compareList.length === 2 && (
            <button className="compare-go" onClick={() => setShowCompare(true)}>Compare →</button>
          )}
        </div>
      )}

      {selectedPlayer && (
        <div className="modal-backdrop" onClick={() => setSelectedPlayer(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedPlayer(null)}>✕</button>
            <div className="modal-banner">
              <span className={`pos-badge pos-${positionGroup(selectedPlayer.Pos)} modal-pos`}>{selectedPlayer.Pos}</span>
              <span className="modal-number">{selectedPlayer.Goals}</span>
            </div>
            <h2>{selectedPlayer.Player}</h2>
            <p className="modal-sub">{selectedPlayer.Squad} · {selectedPlayer.Comp} · {selectedPlayer.Nation}</p>
            <div className="stat-grid">
              {STAT_COLUMNS.map(col => (
                <div key={col.key} className="stat-box">
                  <div className="stat-value">{selectedPlayer[col.key]}</div>
                  <div className="stat-label">{col.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showCompare && compareList.length === 2 && (
        <div className="modal-backdrop" onClick={() => setShowCompare(false)}>
          <div className="modal compare-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowCompare(false)}>✕</button>
            <div className="compare-header">
              <div className="compare-player-name">{compareList[0].Player}</div>
              <div className="compare-vs">VS</div>
              <div className="compare-player-name">{compareList[1].Player}</div>
            </div>
            <div className="compare-sub">
              <span>{compareList[0].Squad} · {compareList[0].Comp}</span>
              <span>{compareList[1].Squad} · {compareList[1].Comp}</span>
            </div>
            <div className="compare-rows">
              {STAT_COLUMNS.map(col => {
                const a = compareList[0][col.key];
                const b = compareList[1][col.key];
                const aWins = a > b;
                const bWins = b > a;
                return (
                  <div key={col.key} className="compare-row">
                    <span className={`compare-value ${aWins ? 'compare-win' : ''}`}>{a}</span>
                    <span className="compare-label">{col.label}</span>
                    <span className={`compare-value ${bWins ? 'compare-win' : ''}`}>{b}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
