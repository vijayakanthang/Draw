interface PageNavProps {
  pages: { id: string; name: string }[];
  activePageId: string;
  onCreate: () => void;
  onRename: (id: string, name: string) => void;
  onSelect: (id: string) => void;
}

export default function PageNav({ pages, activePageId, onCreate, onRename, onSelect }: PageNavProps) {
  const active = pages.find((p) => p.id === activePageId);
  return (
    <div className="flex items-center gap-3 bg-white text-slate-800 p-3 rounded-xl shadow-sm ring-1 ring-slate-200 w-full">
      <button onClick={onCreate} className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded-lg shadow-sm" title="Create page" aria-label="Create page">
        +
      </button>

      <input
        className="px-3 py-1 rounded-lg border border-slate-200 shadow-sm w-56"
        value={active?.name || "Untitled"}
        onChange={(e) => active && onRename(active.id, e.target.value)}
        aria-label="Page name"
      />

      <div className="ml-auto flex gap-2">
        {pages.map((p) => (
          <button
            key={p.id}
            onClick={() => onSelect(p.id)}
            className={`px-2 py-1 rounded-md text-xs ${activePageId === p.id ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
            title={p.name}
            aria-label={`Switch to ${p.name}`}
          >
            {p.name}
          </button>
        ))}
      </div>
    </div>
  );
}


