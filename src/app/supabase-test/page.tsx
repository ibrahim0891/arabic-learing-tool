import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export default async function SupabaseTodosPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: todos, error } = await supabase.from('todos').select();

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 space-y-6">
      <div className="border-b border-[var(--border-subtle)] pb-4">
        <h1 className="editorial-title text-2xl font-bold text-[var(--ink-primary)]">
          Supabase Test Connection
        </h1>
        <p className="text-xs text-[var(--ink-muted)] mt-1">
          Querying 'todos' table from your Supabase project.
        </p>
      </div>

      {error ? (
        <div className="p-4 rounded-xl bg-[var(--accent-terracotta)]/10 border border-[var(--accent-terracotta)]/30 text-xs text-[var(--accent-terracotta)]">
          <strong>Database Notice:</strong> {error.message}
          <div className="text-[11px] text-[var(--ink-muted)] mt-1">
            (If the 'todos' table does not exist in your Supabase project yet, create it in your Supabase dashboard or SQL editor).
          </div>
        </div>
      ) : (
        <ul className="space-y-2">
          {todos && todos.length > 0 ? (
            todos.map((todo: any) => (
              <li
                key={todo.id}
                className="p-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-sm text-[var(--ink-primary)] flex items-center justify-between"
              >
                <span>{todo.name || todo.title || JSON.stringify(todo)}</span>
                <span className="text-[10px] text-[var(--accent-cypress)] font-semibold">Active</span>
              </li>
            ))
          ) : (
            <div className="py-8 text-center text-xs text-[var(--ink-muted)] border border-dashed border-[var(--border-subtle)] rounded-xl">
              Connected to Supabase! No rows found in 'todos' table.
            </div>
          )}
        </ul>
      )}
    </div>
  );
}
