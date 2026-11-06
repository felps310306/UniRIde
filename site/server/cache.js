// Adaptação do padrão de services/cache_mapa.py do EscalaCCO:
// validade explícita, último snapshot e uma atualização compartilhada por chave.
// Cache em memória por processo/isolate; não requer Redis/PostgreSQL.
export function createSnapshotCache({ now = Date.now, maxEntries = 100 } = {}) {
  const entries = new Map();
  const pending = new Map();
  return {
    async get(key, loader, { ttl = 300000, staleFor = 3600000 } = {}) {
      const previous = entries.get(key);
      if (previous && now() - previous.time < ttl) return { ...previous, stale: false };
      if (pending.has(key)) return pending.get(key);
      const operation = (async () => {
        try {
          const data = await Promise.resolve().then(loader);
          const entry = { data, time: now(), stale: false };
          entries.delete(key); entries.set(key, entry);
          while (entries.size > maxEntries) entries.delete(entries.keys().next().value);
          return entry;
        } catch (error) {
          if (previous && now() - previous.time < staleFor) return { ...previous, stale: true };
          throw error;
        } finally { pending.delete(key); }
      })();
      pending.set(key, operation);
      return operation;
    },
  };
}
