/**
 * youZen transcript panel (variant A + search, approved 2026-11-04;
 * mockup: .superpowers/brainstorm/…/painel-a-v2.html).
 *
 * Rows are blocks of caption cues. The cue being spoken is yellow; it moves
 * phrase by phrase because YouTube sends no per-word timing.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Captions, ChevronDown, ChevronUp, Clock, Copy, Download, Ellipsis, Languages, Search, X } from 'lucide-react';
import { mergeBlocks, findActiveCue, alignTranslations } from './captions.js';
import { textOf, buildTxt, buildSrt, buildVtt, safeFileName } from './exporters.js';
import { findMatches, splitRanges } from './search.js';
import { editKey, loadEdits, saveEdits } from './edits.js';
import { Row } from './Rows.jsx';
import { TrackMenu, TranslateMenu, ExportMenu, MoreMenu } from './Menus.jsx';

const SETTINGS = {
  lang: ['transcriptLang', null],
  translateLang: ['transcriptTranslateLang', null],
  showTime: ['transcriptShowTime', true],
  autoScroll: ['transcriptAutoScroll', true],
};
const POLL_MS = 500;
const TOAST_MS = 1400;
const baseLang = (code) => String(code ?? '').toLowerCase().split('-')[0];
const reducedMotion = () => globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

function useSettings(ch) {
  const [settings, setSettings] = useState(null);
  useEffect(() => {
    const keys = Object.values(SETTINGS).map(([k]) => k);
    ch.storage.local.get(keys, (r = {}) => {
      setSettings(Object.fromEntries(Object.entries(SETTINGS).map(([name, [k, d]]) => [name, r[k] ?? d])));
    });
  }, [ch]);
  const update = useCallback(
    (patch) => {
      setSettings((prev) => ({ ...prev, ...patch }));
      ch.storage.local.set(Object.fromEntries(Object.entries(patch).map(([name, v]) => [SETTINGS[name][0], v])));
    },
    [ch],
  );
  return [settings, update];
}

/** Scrolls `list` so `el` is centred, without scrolling YouTube's page. */
function centerIn(list, el) {
  if (!list || !el) return;
  const top = el.getBoundingClientRect().top - list.getBoundingClientRect().top + list.scrollTop;
  const target = top - list.clientHeight / 2 + el.offsetHeight / 2;
  // Long jumps (search, seeking far) land at once; a smooth scroll over thousands of px drags.
  const far = Math.abs(target - list.scrollTop) > list.clientHeight * 2;
  list.scrollTo?.({ top: target, behavior: far || reducedMotion() ? 'auto' : 'smooth' });
}

export default function Panel({ source, doc = document, ch = chrome, getVideoId, getVideo, onClose }) {
  const [settings, updateSettings] = useSettings(ch);
  const [videoId, setVideoId] = useState(getVideoId);
  const [dark, setDark] = useState(() => doc.documentElement.hasAttribute('dark'));
  const [nonce, setNonce] = useState(0);
  const [status, setStatus] = useState('loading'); // loading | ready | none | error | rateLimited
  const [adShowing, setAdShowing] = useState(false);
  const [player, setPlayer] = useState(null);
  const [track, setTrack] = useState(null);
  const [cues, setCues] = useState([]);
  const [translated, setTranslated] = useState(null); // string[] aligned with cues, or null
  const [edits, setEdits] = useState({});
  const [versions, setVersions] = useState({});
  const [editing, setEditing] = useState(false);
  const [active, setActive] = useState(-1);
  const [following, setFollowing] = useState(true);
  const [search, setSearch] = useState({ open: false, query: '', cur: 0 });
  const [menu, setMenu] = useState(null);
  const [toast, setToast] = useState(null);
  const listRef = useRef(null);
  const inputRef = useRef(null);

  // Follow YouTube's navigation and theme.
  useEffect(() => {
    const id = setInterval(() => setVideoId(getVideoId()), POLL_MS);
    const observer = new MutationObserver(() => setDark(doc.documentElement.hasAttribute('dark')));
    observer.observe(doc.documentElement, { attributes: true, attributeFilter: ['dark'] });
    return () => {
      clearInterval(id);
      observer.disconnect();
    };
  }, [doc, getVideoId]);

  // New video: reset and read its tracks.
  useEffect(() => {
    if (!videoId || !settings) return undefined;
    let stale = false;
    setStatus('loading');
    setPlayer(null);
    setTrack(null);
    setCues([]);
    setTranslated(null);
    setActive(-1);
    setEditing(false);
    setMenu(null);
    setFollowing(settings.autoScroll);
    source.resetAttempts(videoId);
    source.getPlayer(videoId).then((p) => {
      if (stale) return;
      if (!p) return setStatus('error');
      setPlayer(p);
      if (!p.tracks.length) return setStatus('none');
      const t = p.tracks.find((x) => x.lang === settings.lang) ?? p.tracks.find((x) => x.spoken) ?? p.tracks[0];
      setTrack({ ...t, videoId });
    });
    return () => {
      stale = true;
    };
    // settings is read once per video on purpose: changing a setting must not reload.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId, nonce, settings === null, source]);

  // Load the chosen track. `track.videoId` guards the commit where the video changed but
  // `track` still holds the previous video's track.
  useEffect(() => {
    if (!track || track.videoId !== videoId) return undefined;
    let stale = false;
    setStatus('loading');
    setCues([]);
    source.loadTrack(videoId, track, null).then((r) => {
      if (stale) return;
      if (r.cues) {
        setCues(r.cues);
        setStatus('ready');
      } else {
        setStatus(r.error === 'rateLimited' ? 'rateLimited' : r.error === 'empty' ? 'none' : 'error');
      }
    });
    loadEdits(editKey(videoId, track.lang, track.auto ? 'asr' : ''), ch).then((e) => !stale && setEdits(e));
    return () => {
      stale = true;
    };
  }, [track, videoId, source, ch]);

  // Translation (YouTube translates the same track through `tlang`).
  const translateLang = settings?.translateLang ?? null;
  useEffect(() => {
    setTranslated(null);
    if (!translateLang || !track || track.videoId !== videoId || !cues.length) return undefined;
    if (baseLang(translateLang) === baseLang(track.lang)) return undefined;
    let stale = false;
    source.loadTrack(videoId, track, translateLang).then((r) => {
      if (stale) return;
      if (r.cues) setTranslated(alignTranslations(cues, r.cues));
      else flash("Couldn't load the translation");
    });
    return () => {
      stale = true;
    };
  }, [translateLang, track, cues, videoId, source]);

  // While loading, say so when an ad is what we are waiting for.
  useEffect(() => {
    if (status !== 'loading') return undefined;
    const tick = () => setAdShowing(source.isAdShowing());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [status, source]);

  // Playback position → active cue.
  useEffect(() => {
    if (!cues.length) return undefined;
    const video = getVideo();
    if (!video) return undefined;
    const update = () => setActive(findActiveCue(cues, video.currentTime));
    update();
    const events = ['timeupdate', 'seeked', 'seeking'];
    events.forEach((e) => video.addEventListener(e, update));
    return () => events.forEach((e) => video.removeEventListener(e, update));
  }, [cues, getVideo, videoId]);

  const blocks = useMemo(() => mergeBlocks(cues), [cues]);
  const blockOf = useMemo(() => {
    const out = new Array(cues.length);
    blocks.forEach((b, bi) => {
      for (let i = b.from; i <= b.to; i++) out[i] = bi;
    });
    return out;
  }, [blocks, cues.length]);
  const text = useMemo(() => textOf(cues, edits), [cues, edits]);
  const trText = useMemo(() => (translated ? (i) => translated[i] ?? '' : null), [translated]);
  const activeBlock = active >= 0 ? blockOf[active] : -1;

  const rows = useMemo(
    () =>
      blocks.map((b) => {
        const phrases = [];
        for (let i = b.from; i <= b.to; i++) {
          phrases.push({ i, text: text(i), edited: edits[Math.round(cues[i].start * 1000)] !== undefined });
        }
        const tr = trText ? phrases.map((p) => trText(p.i)).filter(Boolean).join(' ') : '';
        return { block: b, phrases, translation: tr };
      }),
    [blocks, text, trText, edits, cues],
  );

  // Search over what is shown (original + translation), accent-insensitive.
  const hits = useMemo(() => {
    const byBlock = new Map();
    let total = 0;
    if (!search.open) return { byBlock, total };
    rows.forEach((r, bi) => {
      const parts = r.phrases.map((p) => p.text);
      const ranges = findMatches(parts.join(' '), search.query);
      const o = ranges.length ? splitRanges(parts, ranges, total) : null;
      total += ranges.length;
      const trRanges = r.translation ? findMatches(r.translation, search.query) : [];
      const t = trRanges.length ? splitRanges([r.translation], trRanges, total)[0] : null;
      total += trRanges.length;
      if (o || t) byBlock.set(bi, { o, t });
    });
    return { byBlock, total };
  }, [rows, search.open, search.query]);
  const cur = hits.total ? Math.min(search.cur, hits.total - 1) : -1;

  // Keep the current block in view while following.
  useEffect(() => {
    if (!following || activeBlock < 0 || search.open || editing) return;
    centerIn(listRef.current, listRef.current?.querySelector(`[data-b="${activeBlock}"]`));
    // `rows`/showTime: a translation or the time column changes row heights, so re-centre.
  }, [activeBlock, following, search.open, editing, rows, settings?.showTime]);

  // Bring the current match into view.
  useEffect(() => {
    if (cur < 0) return;
    centerIn(listRef.current, listRef.current?.querySelector('mark.cur'));
  }, [cur, search.query]);

  function flash(message) {
    setToast(message);
    setTimeout(() => setToast((t) => (t === message ? null : t)), TOAST_MS);
  }

  const seek = useCallback(
    (i) => {
      const video = getVideo();
      if (video && cues[i]) video.currentTime = cues[i].start;
    },
    [cues, getVideo],
  );

  const key = track && videoId ? editKey(videoId, track.lang, track.auto ? 'asr' : '') : null;
  const commit = useCallback(
    (i, raw) => {
      if (!key || !cues[i]) return;
      const value = String(raw ?? '').replace(/\s+/g, ' ').trim();
      const ms = Math.round(cues[i].start * 1000);
      setEdits((prev) => {
        const next = { ...prev };
        if (!value || value === cues[i].text) delete next[ms];
        else next[ms] = value;
        if (next[ms] === prev[ms]) return prev;
        void saveEdits(key, next, ch);
        return next;
      });
      setVersions((v) => ({ ...v, [i]: (v[i] ?? 0) + 1 }));
    },
    [key, cues, ch],
  );

  const openSearch = () => {
    setMenu(null);
    setFollowing(false);
    setSearch((s) => ({ ...s, open: true }));
    setTimeout(() => inputRef.current?.focus(), 0);
  };
  const closeSearch = () => setSearch({ open: false, query: '', cur: 0 });
  const step = (d) => hits.total && setSearch((s) => ({ ...s, cur: (Math.max(0, cur) + d + hits.total) % hits.total }));

  const onKeyDown = (e) => {
    if ((e.metaKey || e.ctrlKey) && !e.altKey && !e.shiftKey && e.key.toLowerCase() === 'f' && status === 'ready') {
      e.preventDefault();
      openSearch();
    } else if (e.key === 'Escape') {
      if (menu) setMenu(null);
      else if (search.open) closeSearch();
      else return;
      e.preventDefault();
    }
  };

  const transcriptText = () => buildTxt({ blocks, text, time: settings.showTime, tr: trText });
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(transcriptText());
      flash('Copied');
    } catch {
      flash("Couldn't copy");
    }
  };

  const download = ({ format, time, withTr }) => {
    const tr = withTr ? trText : null;
    const body =
      format === 'SRT' ? buildSrt({ cues, text, tr }) : format === 'VTT' ? buildVtt({ cues, text, tr }) : buildTxt({ blocks, text, time, tr });
    const url = URL.createObjectURL(new Blob([body], { type: 'text/plain;charset=utf-8' }));
    const a = doc.createElement('a');
    a.href = url;
    a.download = `${safeFileName(player?.title)}.${format.toLowerCase()}`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMenu(null);
  };

  const toggleMenu = (name) => setMenu((m) => (m === name ? null : name));
  const pickTrack = (t) => {
    setMenu(null);
    if (t.lang !== track?.lang) setTrack({ ...t, videoId });
    updateSettings({ lang: t.lang });
  };
  const pickTranslation = (code) => {
    setMenu(null);
    updateSettings({ translateLang: code });
  };
  const follow = () => {
    const next = !following;
    setFollowing(next);
    updateSettings({ autoScroll: next });
    if (next && activeBlock >= 0) centerIn(listRef.current, listRef.current?.querySelector(`[data-b="${activeBlock}"]`));
  };
  const stopFollowing = () => following && setFollowing(false);

  const translationLabel = translateLang
    ? (player?.translations.find((l) => l.code === translateLang)?.label ?? translateLang)
    : 'Translate';
  const ready = status === 'ready' && settings;
  const rootClass = `yz-root${dark ? '' : ' is-light'}${editing ? ' editing' : ''}`;

  return (
    <div
      className={rootClass}
      style={videoId ? { '--thumb': `url(https://i.ytimg.com/vi/${encodeURIComponent(videoId)}/mqdefault.jpg)` } : undefined}
      onKeyDown={onKeyDown}
    >
      <i className="light" />
      <i className="vignette" />

      <div className="head">
        {editing ? (
          <div className="editbar">
            <span className="sp">
              <b>Editing.</b> Enter: next phrase · Esc: undo
            </span>
            <button type="button" className="primary" onClick={() => setEditing(false)}>
              Done
            </button>
          </div>
        ) : search.open ? (
          <>
            <label className="search nv-field">
              <Search className="i" aria-hidden="true" />
              <input
                ref={inputRef}
                value={search.query}
                placeholder="Search the transcript"
                aria-label="Search the transcript"
                onChange={(e) => setSearch({ open: true, query: e.target.value, cur: 0 })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    step(e.shiftKey ? -1 : 1);
                  }
                }}
              />
              <span className="n" aria-live="polite">
                {hits.total ? `${cur + 1} of ${hits.total}` : search.query.trim() ? 'No matches' : ''}
              </span>
              <button type="button" className="ib" aria-label="Previous match" onClick={() => step(-1)}>
                <ChevronUp className="i" />
              </button>
              <button type="button" className="ib" aria-label="Next match" onClick={() => step(1)}>
                <ChevronDown className="i" />
              </button>
            </label>
            <button type="button" className="ib" aria-label="Close search" onClick={closeSearch}>
              <X className="i" />
            </button>
          </>
        ) : (
          <>
            {player?.tracks.length > 0 && (
              <button type="button" className="chip" aria-haspopup="menu" aria-expanded={menu === 'track'} onClick={() => toggleMenu('track')}>
                <Captions className="i" aria-hidden="true" />
                <span>{track?.label ?? '…'}</span>
                <ChevronDown className="i cv" aria-hidden="true" />
              </button>
            )}
            {ready && player?.translations.length > 0 && (
              <button
                type="button"
                className={`chip${translateLang ? ' on' : ' ghost'}`}
                aria-haspopup="menu"
                aria-expanded={menu === 'translate'}
                onClick={() => toggleMenu('translate')}
              >
                <Languages className="i" aria-hidden="true" />
                <span>{translationLabel}</span>
              </button>
            )}
            <span className="sp" />
            {ready && (
              <button type="button" className="ib" aria-label="Search (Ctrl+F)" title="Search (Ctrl+F)" onClick={openSearch}>
                <Search className="i" />
              </button>
            )}
            <button type="button" className="ib" aria-label="Close transcript" title="Close" onClick={onClose}>
              <X className="i" />
            </button>
          </>
        )}
      </div>

      {ready ? (
        <div className="list" ref={listRef} onWheel={stopFollowing} onTouchMove={stopFollowing}>
          {rows.map((r, bi) => (
            <Row
              key={bi}
              index={bi}
              block={r.block}
              phrases={r.phrases}
              say={bi === activeBlock ? active : -1}
              now={bi === activeBlock}
              past={activeBlock >= 0 && bi < activeBlock}
              showTime={settings.showTime}
              translation={r.translation}
              hits={hits.byBlock.get(bi) ?? null}
              cur={cur}
              editing={editing}
              versions={editing ? versions : null}
              onSeek={seek}
              onCommit={commit}
            />
          ))}
        </div>
      ) : (
        <Placeholder status={status} ad={adShowing} onRetry={() => setNonce((n) => n + 1)} />
      )}

      {ready && !editing && (
        <div className="dock" role="toolbar" aria-label="Transcript actions">
          <button type="button" className="dk" aria-pressed={following} onClick={follow} title="Follow the video">
            <i className="dot" />
            Scroll
          </button>
          <button type="button" className="dk" aria-pressed={settings.showTime} onClick={() => updateSettings({ showTime: !settings.showTime })}>
            <Clock className="i" aria-hidden="true" />
            Time
          </button>
          <span className="dsep" />
          <button type="button" className="dk" onClick={copy}>
            <Copy className="i" aria-hidden="true" />
            Copy
          </button>
          <button type="button" className="dk" aria-haspopup="menu" aria-expanded={menu === 'export'} onClick={() => toggleMenu('export')}>
            <Download className="i" aria-hidden="true" />
            Export
          </button>
          <button type="button" className="dk ic" aria-label="More" aria-haspopup="menu" aria-expanded={menu === 'more'} onClick={() => toggleMenu('more')}>
            <Ellipsis className="i" />
          </button>
        </div>
      )}

      {menu && <div style={{ position: 'absolute', inset: 0, zIndex: 4 }} onClick={() => setMenu(null)} />}
      {menu === 'track' && <TrackMenu tracks={player?.tracks ?? []} current={track} onPick={pickTrack} />}
      {menu === 'translate' && <TranslateMenu languages={player?.translations ?? []} current={translateLang} onPick={pickTranslation} />}
      {menu === 'export' && <ExportMenu hasTranslation={!!translated} defaultTime={settings.showTime} onDownload={download} />}
      {menu === 'more' && (
        <MoreMenu
          hasEdits={Object.keys(edits).length > 0}
          onEdit={() => {
            setMenu(null);
            setFollowing(false);
            closeSearch();
            setEditing(true);
          }}
          onUndoAll={() => {
            setMenu(null);
            setEdits({});
            setVersions({});
            if (key) void saveEdits(key, {}, ch);
          }}
        />
      )}
      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </div>
  );
}

function Placeholder({ status, ad, onRetry }) {
  if (status === 'loading') {
    return (
      <div className="state" aria-busy="true">
        {ad && <span>Waiting for the ad to finish…</span>}
        <div className="skel" style={{ width: '100%' }} aria-hidden="true">
          {[92, 78, 85, 60, 88, 70].map((w, k) => (
            <i key={k} style={{ width: `${w}%` }} />
          ))}
        </div>
      </div>
    );
  }
  if (status === 'none') {
    return (
      <div className="state">
        <b>No transcript for this video</b>
        <span>YouTube has no captions for it.</span>
      </div>
    );
  }
  const limited = status === 'rateLimited';
  return (
    <div className="state">
      <b>{limited ? 'YouTube is limiting caption requests' : "Couldn't load the transcript"}</b>
      <span>{limited ? 'Your network asked for too many. Try again in a few minutes.' : 'Try again, or reload the page if it keeps happening.'}</span>
      <button type="button" className="primary" onClick={onRetry}>
        Try again
      </button>
    </div>
  );
}
