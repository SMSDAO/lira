/**
 * Visual drag-and-drop DSL editor.
 *
 * Translates canvas blocks into Lira DSL source code that the core-engine can
 * compile.  Blocks are moved by dragging; connections between state blocks
 * represent transitions.
 */

import React, { useCallback, useReducer, useRef, useState } from 'react';
import type { EditorBlock, EditorBlockKind, EditorGraph } from '@lira/types';

// ──────────────────────────────────────────────────────────────────────────────
// State management
// ──────────────────────────────────────────────────────────────────────────────

type EditorAction =
  | { type: 'ADD_BLOCK'; block: EditorBlock }
  | { type: 'MOVE_BLOCK'; id: string; position: { x: number; y: number } }
  | { type: 'REMOVE_BLOCK'; id: string }
  | { type: 'CONNECT'; from: string; to: string }
  | { type: 'DISCONNECT'; from: string; to: string };

function editorReducer(state: EditorGraph, action: EditorAction): EditorGraph {
  switch (action.type) {
    case 'ADD_BLOCK':
      return { ...state, blocks: [...state.blocks, action.block] };
    case 'MOVE_BLOCK':
      return {
        ...state,
        blocks: state.blocks.map((b: EditorBlock) =>
          b.id === action.id ? { ...b, position: action.position } : b,
        ),
      };
    case 'REMOVE_BLOCK':
      return {
        ...state,
        blocks: state.blocks.filter((b: EditorBlock) => b.id !== action.id),
        connections: state.connections.filter(
          ([s, t]: [string, string]) => s !== action.id && t !== action.id,
        ),
      };
    case 'CONNECT':
      if (state.connections.some(([s, t]: [string, string]) => s === action.from && t === action.to)) {
        return state;
      }
      return { ...state, connections: [...state.connections, [action.from, action.to] as [string, string]] };
    case 'DISCONNECT':
      return {
        ...state,
        connections: state.connections.filter(
          ([s, t]: [string, string]) => !(s === action.from && t === action.to),
        ),
      };
  }
}

const INITIAL_GRAPH: EditorGraph = { blocks: [], connections: [] };

// ──────────────────────────────────────────────────────────────────────────────
// DSL code generation
// ──────────────────────────────────────────────────────────────────────────────

/** Sanitize a user-entered label to a valid DSL identifier [A-Za-z0-9_]+. */
function sanitizeIdent(label: string): string {
  // Replace spaces/hyphens with underscores, then strip non-alphanumeric/underscore chars
  const sanitized = label.replace(/[\s-]+/g, '_').replace(/[^A-Za-z0-9_]/g, '');
  // Must not start with a digit
  return sanitized.match(/^[0-9]/) ? `_${sanitized}` : sanitized || 'Unnamed_Block';
}

function graphToDsl(graph: EditorGraph): string {
  const stateBlocks = graph.blocks.filter((b: EditorBlock) => b.kind === 'state');
  // Only generate transitions between state blocks
  const stateIds = new Set(stateBlocks.map((b: EditorBlock) => b.id));
  const transitionEdges = graph.connections.filter(
    ([fromId, toId]: [string, string]) => stateIds.has(fromId) && stateIds.has(toId),
  );

  const stateLines = stateBlocks
    .map((b: EditorBlock) => {
      const initial = b.props.initial ? ' initial' : '';
      const terminal = b.props.terminal ? ' terminal' : '';
      return `    ${sanitizeIdent(b.label)}${initial}${terminal}`;
    })
    .join('\n');

  const transitionLines = transitionEdges
    .map(([fromId, toId]: [string, string]) => {
      const fromBlock = graph.blocks.find((b: EditorBlock) => b.id === fromId);
      const toBlock = graph.blocks.find((b: EditorBlock) => b.id === toId);
      if (!fromBlock || !toBlock) return null;
      return `    ${sanitizeIdent(fromBlock.label)} -> ${sanitizeIdent(toBlock.label)}`;
    })
    .filter(Boolean)
    .join('\n');

  return [
    'version "1.0"',
    'contract LiraContract {',
    '  states {',
    stateLines || '    # No states defined',
    '  }',
    '  transitions {',
    transitionLines || '    # No transitions defined',
    '  }',
    '}',
  ].join('\n');
}

// ──────────────────────────────────────────────────────────────────────────────
// Block palette
// ──────────────────────────────────────────────────────────────────────────────

const BLOCK_KINDS: Array<{ kind: EditorBlockKind; label: string; color: string }> = [
  { kind: 'state',        label: 'State',         color: 'bg-blue-500/20 border-blue-500/60' },
  { kind: 'transition',   label: 'Transition',     color: 'bg-purple-500/20 border-purple-500/60' },
  { kind: 'trigger',      label: 'Trigger',        color: 'bg-green-500/20 border-green-500/60' },
  { kind: 'action',       label: 'Action',         color: 'bg-yellow-500/20 border-yellow-500/60' },
  { kind: 'safety_check', label: 'Safety Check',   color: 'bg-red-500/20 border-red-500/60' },
];

function blockColorFor(kind: EditorBlockKind) {
  return BLOCK_KINDS.find(b => b.kind === kind)?.color ?? 'bg-gray-500/20 border-gray-500/60';
}

// ──────────────────────────────────────────────────────────────────────────────
// Canvas block component
// ──────────────────────────────────────────────────────────────────────────────

interface CanvasBlockProps {
  block: EditorBlock;
  onMove: (id: string, pos: { x: number; y: number }) => void;
  onRemove: (id: string) => void;
  onStartConnect: (id: string) => void;
  onEndConnect: (id: string) => void;
  connecting: string | null;
}

function CanvasBlock({
  block,
  onMove,
  onRemove,
  onStartConnect,
  onEndConnect,
  connecting,
}: CanvasBlockProps) {
  const dragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-action]')) return;
    dragging.current = true;
    offset.current = { x: e.clientX - block.position.x, y: e.clientY - block.position.y };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragging.current) return;
    onMove(block.id, { x: e.clientX - offset.current.x, y: e.clientY - offset.current.y });
  }, [block.id, onMove]);

  const handleMouseUp = useCallback(() => {
    dragging.current = false;
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseMove]);

  const isConnectTarget = connecting && connecting !== block.id;

  return (
    <div
      className={`absolute select-none cursor-move rounded-lg border px-3 py-2 text-sm font-mono
        ${blockColorFor(block.kind)}
        ${isConnectTarget ? 'ring-2 ring-white/80 cursor-crosshair' : ''}`}
      style={{ left: block.position.x, top: block.position.y, minWidth: 120 }}
      onMouseDown={handleMouseDown}
      onClick={() => { if (connecting) onEndConnect(block.id); }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs uppercase opacity-60 font-bold">{block.kind}</span>
        <div className="flex gap-1">
          <button
            data-action="connect"
            title="Connect"
            className="opacity-60 hover:opacity-100 text-xs px-1"
            onClick={e => { e.stopPropagation(); onStartConnect(block.id); }}
          >
            ⟶
          </button>
          <button
            data-action="remove"
            title="Remove"
            className="opacity-60 hover:opacity-100 text-xs px-1 text-red-400"
            onClick={e => { e.stopPropagation(); onRemove(block.id); }}
          >
            ✕
          </button>
        </div>
      </div>
      <div className="mt-1 font-semibold text-white">{block.label}</div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Main editor
// ──────────────────────────────────────────────────────────────────────────────

export default function VisualEditor() {
  const [graph, dispatch] = useReducer(editorReducer, INITIAL_GRAPH);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [dsl, setDsl] = useState('');
  const [showDsl, setShowDsl] = useState(false);
  const [contractName, setContractName] = useState('');
  const counter = useRef(0);
  // Track whether a `state` block has been added so the first one gets initial=true
  const hasStateBlock = useRef(false);

  const addBlock = (kind: EditorBlockKind) => {
    const id = `block-${++counter.current}`;
    const label =
      kind === 'state' && contractName.trim()
        ? contractName.trim()
        : `${kind.charAt(0).toUpperCase() + kind.slice(1)}${counter.current}`;
    const isFirstState = kind === 'state' && !hasStateBlock.current;
    if (kind === 'state') hasStateBlock.current = true;
    dispatch({
      type: 'ADD_BLOCK',
      block: {
        id,
        kind,
        label,
        props: kind === 'state'
          ? { initial: isFirstState, terminal: false }
          : {},
        position: { x: 60 + (counter.current % 5) * 160, y: 80 + Math.floor(counter.current / 5) * 100 },
      },
    });
    setContractName('');
  };

  const handleStartConnect = (id: string) => setConnecting(id);

  const handleEndConnect = (id: string) => {
    if (connecting && connecting !== id) {
      dispatch({ type: 'CONNECT', from: connecting, to: id });
    }
    setConnecting(null);
  };

  const generateDsl = () => {
    setDsl(graphToDsl(graph));
    setShowDsl(true);
  };

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-bold text-neo-blue">Visual DSL Editor</h2>
        <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded">drag & drop</span>
      </div>

      {/* Palette */}
      <div className="flex flex-wrap items-center gap-2">
        <input
          className="bg-neo-darker border border-neo-blue/30 rounded px-2 py-1 text-sm text-white placeholder-gray-500"
          placeholder="Block label…"
          value={contractName}
          onChange={e => setContractName(e.target.value)}
        />
        {BLOCK_KINDS.map(({ kind, label }) => (
          <button
            key={kind}
            className="text-xs px-3 py-1.5 rounded border border-neo-blue/40 bg-neo-dark text-neo-blue
              hover:bg-neo-blue/20 transition font-mono"
            onClick={() => addBlock(kind)}
          >
            + {label}
          </button>
        ))}
        {connecting && (
          <span className="text-xs text-yellow-400 animate-pulse">
            Click a block to connect…{' '}
            <button className="underline" onClick={() => setConnecting(null)}>cancel</button>
          </span>
        )}
        <button
          className="ml-auto text-xs px-3 py-1.5 rounded bg-neo-blue text-neo-darker font-bold hover:opacity-90 transition"
          onClick={generateDsl}
        >
          Generate DSL ⟶
        </button>
      </div>

      {/* Canvas */}
      <div
        className="relative flex-1 rounded-lg border border-neo-blue/20 bg-neo-darker overflow-hidden"
        style={{ minHeight: 400 }}
        onClick={() => { if (connecting) setConnecting(null); }}
      >
        {/* SVG connections */}
        <svg className="absolute inset-0 pointer-events-none w-full h-full">
          {graph.connections.map(([fromId, toId]: [string, string]) => {
            const from = graph.blocks.find((b: EditorBlock) => b.id === fromId);
            const to = graph.blocks.find((b: EditorBlock) => b.id === toId);
            if (!from || !to) return null;
            const x1 = from.position.x + 60;
            const y1 = from.position.y + 20;
            const x2 = to.position.x + 60;
            const y2 = to.position.y + 20;
            return (
              <g key={`${fromId}-${toId}`}>
                <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#3b82f6" strokeWidth={1.5} strokeOpacity={0.6} />
                <circle cx={x2} cy={y2} r={4} fill="#3b82f6" fillOpacity={0.8} />
              </g>
            );
          })}
        </svg>

        {graph.blocks.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-600 select-none">
            Add blocks from the palette to start building your contract
          </div>
        )}

        {graph.blocks.map((block: EditorBlock) => (
          <CanvasBlock
            key={block.id}
            block={block}
            onMove={(id, pos) => dispatch({ type: 'MOVE_BLOCK', id, position: pos })}
            onRemove={id => dispatch({ type: 'REMOVE_BLOCK', id })}
            onStartConnect={handleStartConnect}
            onEndConnect={handleEndConnect}
            connecting={connecting}
          />
        ))}
      </div>

      {/* DSL output */}
      {showDsl && (
        <div className="rounded-lg border border-neo-blue/30 bg-neo-dark p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-neo-blue">Generated DSL</span>
            <button
              className="text-xs text-gray-400 hover:text-white"
              onClick={() => setShowDsl(false)}
            >
              close
            </button>
          </div>
          <pre className="text-xs text-gray-300 font-mono overflow-x-auto whitespace-pre-wrap">{dsl}</pre>
        </div>
      )}
    </div>
  );
}
