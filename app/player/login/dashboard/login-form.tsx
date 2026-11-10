"use client";

import { useEffect, useState } from "react";

type Server = { name: string; port: number };

type LoginResult = {
  ok: boolean;
  error?: string;
  growid?: string;
  server?: { name: string; port: number };
};

export function LoginForm() {
  const [servers, setServers] = useState<Server[]>([]);
  const [server, setServer] = useState("");
  const [growid, setGrowid] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<LoginResult | null>(null);

  useEffect(() => {
    fetch("/api/servers")
      .then((res) => res.json())
      .then((data: { servers?: Server[] }) => {
        const list = data.servers ?? [];
        setServers(list);
        if (list.length > 0) setServer(list[0].name);
      })
      .catch(() => setError("Daftar server tidak bisa dimuat."));
  }, []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ server, growid, password }),
      });
      const data: LoginResult = await res.json();

      if (!data.ok) {
        setError(data.error ?? "Gagal masuk.");
        return;
      }

      setResult(data);
    } catch {
      setError("Tidak bisa menghubungi server.");
    } finally {
      setBusy(false);
    }
  }

  if (result?.ok) {
    return (
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h1 className="text-xl font-semibold">Berhasil masuk</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Selamat datang, <span className="font-medium text-foreground">{result.growid}</span>.
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Server <span className="font-medium text-foreground">{result.server?.name}</span> · port {result.server?.port}
        </p>
        <button
          type="button"
          onClick={() => {
            setResult(null);
            setPassword("");
          }}
          className="mt-5 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
        >
          Masuk lagi
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-sm">
      <h1 className="text-xl font-semibold">Masuk</h1>
      <p className="mt-1 mb-5 text-sm text-muted-foreground">
        Pilih server, lalu masukkan akun game kamu.
      </p>

      {error ? (
        <p className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label htmlFor="server" className="mb-1.5 block text-sm font-medium">
            Nama server
          </label>
          <select
            id="server"
            value={server}
            onChange={(event) => setServer(event.target.value)}
            required
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
          >
            {servers.length === 0 ? <option value="">(belum ada server)</option> : null}
            {servers.map((item) => (
              <option key={item.name} value={item.name}>
                {item.name} — port {item.port}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="growid" className="mb-1.5 block text-sm font-medium">
            GrowID
          </label>
          <input
            id="growid"
            value={growid}
            onChange={(event) => setGrowid(event.target.value)}
            autoComplete="username"
            required
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <button
          type="submit"
          disabled={busy || servers.length === 0}
          className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-60"
        >
          {busy ? "Memeriksa…" : "Masuk"}
        </button>
      </form>
    </div>
  );
}
