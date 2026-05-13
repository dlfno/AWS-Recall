import { api, ApiError } from "./api";

type Coalesced = { kind: "coalesced"; method: "PATCH" | "PUT"; url: string; getBody: () => unknown };
type Append = { kind: "append"; method: "POST"; url: string; body: unknown };
type Job = Coalesced | Append;

const queue: Job[] = [];
let coalescedByUrl = new Map<string, Coalesced>();
let running = false;

export function enqueueCoalescedPatch(url: string, getBody: () => unknown): void {
  schedule({ kind: "coalesced", method: "PATCH", url, getBody });
}

export function enqueueCoalescedPut(url: string, getBody: () => unknown): void {
  schedule({ kind: "coalesced", method: "PUT", url, getBody });
}

export function enqueueAppendPost(url: string, body: unknown): void {
  queue.push({ kind: "append", method: "POST", url, body });
  void flush();
}

function schedule(job: Coalesced): void {
  const existing = coalescedByUrl.get(job.url);
  if (existing) {
    existing.getBody = job.getBody;
    return;
  }
  coalescedByUrl.set(job.url, job);
  queue.push(job);
  void flush();
}

async function flush(): Promise<void> {
  if (running) return;
  running = true;
  while (queue.length > 0) {
    const job = queue.shift()!;
    if (job.kind === "coalesced") coalescedByUrl.delete(job.url);
    try {
      const body = job.kind === "coalesced" ? job.getBody() : job.body;
      if (job.method === "PATCH") await api.patch(job.url, body);
      else if (job.method === "PUT") await api.put(job.url, body);
      else await api.post(job.url, body);
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        // sesión inválida — drop pending; el handler global hará logout
        queue.length = 0;
        coalescedByUrl.clear();
        break;
      }
      // backoff y reintento — re-encola al frente
      queue.unshift(job);
      if (job.kind === "coalesced") coalescedByUrl.set(job.url, job);
      await sleep(2000);
    }
  }
  running = false;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export async function flushPending(): Promise<void> {
  await flush();
}

if (typeof window !== "undefined") {
  window.addEventListener("online", () => void flush());
  window.addEventListener("beforeunload", () => {
    // Mejor esfuerzo: usar sendBeacon para POSTs append; los coalesced quedan al servidor en el siguiente login
    for (const job of queue) {
      if (job.kind === "append") {
        try {
          const blob = new Blob([JSON.stringify(job.body)], { type: "application/json" });
          navigator.sendBeacon(job.url, blob);
        } catch {
          /* ignore */
        }
      }
    }
  });
}
