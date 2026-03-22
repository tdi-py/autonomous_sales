'use client';

import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

interface ObjectionHandler {
  objection: string;
  response: string;
}

interface ObjectionHandlerTableProps {
  handlers: ObjectionHandler[];
  onChange: (handlers: ObjectionHandler[]) => void;
}

export function ObjectionHandlerTable({ handlers, onChange }: ObjectionHandlerTableProps) {
  const [newObjection, setNewObjection] = useState('');
  const [newResponse, setNewResponse] = useState('');

  function updateHandler(index: number, field: 'objection' | 'response', value: string) {
    const updated = handlers.map((h, i) =>
      i === index ? { ...h, [field]: value } : h,
    );
    onChange(updated);
  }

  function deleteHandler(index: number) {
    onChange(handlers.filter((_, i) => i !== index));
  }

  function addHandler() {
    if (!newObjection.trim() || !newResponse.trim()) return;
    onChange([...handlers, { objection: newObjection.trim(), response: newResponse.trim() }]);
    setNewObjection('');
    setNewResponse('');
  }

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground w-[40%]">
                İtiraz
              </th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">
                Yanıt
              </th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {handlers.map((h, i) => (
              <tr key={i} className="group">
                <td className="px-4 py-2">
                  <input
                    value={h.objection}
                    onChange={(e) => updateHandler(i, 'objection', e.target.value)}
                    className="w-full bg-transparent text-sm focus:outline-none focus:bg-muted/40 rounded px-1 py-0.5"
                  />
                </td>
                <td className="px-4 py-2">
                  <input
                    value={h.response}
                    onChange={(e) => updateHandler(i, 'response', e.target.value)}
                    className="w-full bg-transparent text-sm focus:outline-none focus:bg-muted/40 rounded px-1 py-0.5"
                  />
                </td>
                <td className="px-2 py-2">
                  <button
                    onClick={() => deleteHandler(i)}
                    className="w-6 h-6 rounded opacity-0 group-hover:opacity-100 hover:bg-destructive/10 flex items-center justify-center transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Yeni itiraz ekle */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newObjection}
          onChange={(e) => setNewObjection(e.target.value)}
          placeholder="İtiraz..."
          className="flex-1 h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <input
          type="text"
          value={newResponse}
          onChange={(e) => setNewResponse(e.target.value)}
          placeholder="Yanıt..."
          onKeyDown={(e) => e.key === 'Enter' && addHandler()}
          className="flex-1 h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          onClick={addHandler}
          className="h-9 px-3 rounded-md border border-border hover:bg-accent transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}