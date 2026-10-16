import React from 'react';
import { Search, X, Trash2, Check, Radar, Plus, Building2, Globe } from 'lucide-react';
import { Lead, CrmFilter } from '../../types';

interface SidebarProps {
  leads: Lead[];
  filteredLeads: Lead[];
  selectedLeadId?: string | null;
  onSelectLead: (id: string) => void;
  onDeleteLead: (id: string, name: string) => void;
  activeFilter: CrmFilter;
  onFilterChange: (f: CrmFilter) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  demoLeadsCount: number;
  onClearDemoLeads: () => void;
  onOpenRadar: () => void;
  onOpenAddLead: () => void;
}

const FILTERS: CrmFilter[] = [
  'ALL',
  'Nowy',
  'Po audycie',
  'Oferta gotowa',
  'Skontaktowano',
  'Oferta zaakceptowana',
];

export const Sidebar: React.FC<SidebarProps> = ({
  leads,
  filteredLeads,
  selectedLeadId,
  onSelectLead,
  onDeleteLead,
  activeFilter,
  onFilterChange,
  searchQuery,
  onSearchChange,
  demoLeadsCount,
  onClearDemoLeads,
  onOpenRadar,
  onOpenAddLead,
}) => {
  return (
    <div className="flex w-80 lg:w-96 flex-col border-r border-zinc-800/80 bg-[#0c0e15]">
      <div className="p-4 border-b border-zinc-800/70 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Szukaj firmy, branży, miasta..."
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:border-purple-500 focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-2.5 text-zinc-500 hover:text-zinc-300"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1 text-[11px]">
          {FILTERS.map((filter) => (
            <button
              key={filter}
              onClick={() => onFilterChange(filter)}
              className={`rounded-lg px-2.5 py-1 font-medium transition shrink-0 ${
                activeFilter === filter
                  ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/30'
                  : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
              }`}
            >
              {filter === 'ALL'
                ? 'Wszystkie'
                : filter === 'Skontaktowano'
                ? '📞 Skontaktowano'
                : filter === 'Oferta zaakceptowana'
                ? '✓ Zaakceptowane'
                : filter}
            </button>
          ))}
        </div>

        {demoLeadsCount > 0 && (
          <div className="flex items-center justify-between rounded-xl bg-amber-500/10 border border-amber-500/25 px-2.5 py-1.5 text-[11px]">
            <span className="text-amber-300 font-medium">
              Firmy pokazowe: <strong>{demoLeadsCount}</strong>
            </span>
            <button
              onClick={onClearDemoLeads}
              className="flex items-center gap-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 px-2 py-0.5 font-semibold transition text-[10px]"
            >
              <Trash2 className="h-2.5 w-2.5 text-amber-300" />
              <span>Usuń demo</span>
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-zinc-900/90 p-2 space-y-1">
        {leads.length === 0 ? (
          <div className="p-8 text-center text-xs text-zinc-400 space-y-3">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Check className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="font-semibold text-zinc-200">Baza CRM jest pusta</p>
              <p className="text-[11px] text-zinc-500 mt-0.5">Gotowa na Twoich klientów</p>
            </div>
            <div className="flex flex-col gap-2 pt-1">
              <button
                onClick={onOpenRadar}
                className="flex items-center justify-center gap-1.5 rounded-lg bg-purple-600 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-purple-500 transition shadow-sm"
              >
                <Radar className="h-3 w-3" />
                <span>Wyszukaj firmy (Radar)</span>
              </button>
              <button
                onClick={onOpenAddLead}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-[11px] font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition"
              >
                <Plus className="h-3 w-3" />
                <span>Dodaj ręcznie</span>
              </button>
            </div>
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="p-8 text-center text-xs text-zinc-500">
            <Building2 className="mx-auto mb-2 h-8 w-8 text-zinc-700" />
            <p>Brak firm spełniających kryteria</p>
            <button
              onClick={() => onSearchChange('')}
              className="mt-2 text-purple-400 hover:underline"
            >
              Wyczyść wyszukiwanie
            </button>
          </div>
        ) : (
          filteredLeads.map((lead) => {
            const isSelected = lead.id === selectedLeadId;
            const score = lead.audit?.score;
            return (
              <div
                key={lead.id}
                onClick={() => onSelectLead(lead.id)}
                className={`group relative flex cursor-pointer flex-col gap-1.5 rounded-xl p-3.5 transition ${
                  isSelected
                    ? 'bg-purple-950/20 border border-purple-500/40 shadow-md shadow-purple-900/10'
                    : 'bg-zinc-900/30 border border-transparent hover:bg-zinc-900/80 hover:border-zinc-800'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="font-semibold text-sm text-zinc-100 group-hover:text-purple-300 transition truncate flex-1">
                    {lead.name}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {typeof score === 'number' && (
                      <span
                        className={`rounded-md px-1.5 py-0.5 text-[11px] font-bold shrink-0 ${
                          score < 50
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : score < 75
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        {score}/100
                      </span>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteLead(lead.id, lead.name);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-red-400 hover:bg-red-500/20 rounded-md transition"
                      title={`Usuń firmę "${lead.name}"`}
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-zinc-400 truncate">
                  <Globe className="h-3 w-3 shrink-0 text-zinc-500" />
                  <span className="truncate">
                    {(lead.website || '').replace(/^https?:\/\//, '')}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1 text-[11px]">
                  <span className="text-zinc-500">
                    {lead.city || ''} {lead.industry ? `• ${lead.industry}` : ''}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      lead.status === 'Oferta zaakceptowana'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                        : lead.status === 'Oferta gotowa'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : lead.status === 'Skontaktowano'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 font-medium'
                        : lead.status === 'Po audycie'
                        ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                        : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {lead.status === 'Oferta zaakceptowana'
                      ? '✓ Zaakceptowano'
                      : lead.status === 'Skontaktowano'
                      ? '📞 Skontaktowano'
                      : lead.status}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
