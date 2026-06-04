import { LoaderCircle, Search, X } from 'lucide-react'

interface SearchBoxProps {
  keyword: string;
  onKeywordChange: (value: string) => void;
  loading: boolean;
  onFocus: () => void;
  onClear: () => void;
}

export function SearchBox({
  keyword,
  onKeywordChange,
  loading,
  onFocus,
  onClear,
}: SearchBoxProps) {
  return (
    <div className="w-[360px] shrink-0 xl:w-[420px]">
      <div className="flex h-12 items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-4 transition focus-within:border-cyan-300 focus-within:bg-white">
        <Search className="h-4.5 w-4.5 shrink-0 text-slate-400" />
        <input
          type="text"
          value={keyword}
          onFocus={onFocus}
          onChange={(event) => onKeywordChange(event.target.value)}
          placeholder="搜索景点、商圈、博物馆、美食..."
          className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
          autoComplete="off"
          spellCheck="false"
        />
        {keyword ? (
          <button
            type="button"
            onClick={onClear}
            className="shrink-0 rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
        {loading ? <LoaderCircle className="h-4 w-4 shrink-0 animate-spin text-cyan-500" /> : null}
      </div>
    </div>
  )
}
