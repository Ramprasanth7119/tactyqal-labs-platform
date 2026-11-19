import type { Metadata } from "next";
import Link from "next/link";
import { openApiSpec } from "@/lib/api/openapi";

export const metadata: Metadata = {
  title: "Blog API docs | Tactyqal Labs",
  description: "Interactive reference for the Tactyqal Labs blog REST API (OpenAPI 3.1).",
};

/* eslint-disable @typescript-eslint/no-explicit-any */
const spec = openApiSpec as any;
const METHODS = ["get", "post", "patch", "put", "delete"] as const;
const BADGE: Record<string, string> = {
  get: "bg-sage text-sage-deep",
  post: "bg-sun text-ink",
  patch: "bg-sky text-ink",
  put: "bg-sky text-ink",
  delete: "bg-rose text-accent-deep",
};

function resolve(schema: any): any {
  if (schema?.$ref) return spec.components.schemas[schema.$ref.split("/").pop() as string];
  return schema;
}

function typeLabel(s: any): string {
  if (!s) return "any";
  if (s.$ref) return s.$ref.split("/").pop();
  if (s.enum) return s.enum.map((e: string) => `"${e}"`).join(" | ");
  if (s.type === "array") return `${typeLabel(s.items)}[]`;
  if (Array.isArray(s.type)) return s.type.join(" | ");
  return s.type ?? "object";
}

function Props({ schema }: { schema: any }) {
  const root = resolve(schema?.allOf ? { ...resolve(schema.allOf[0]), properties: { ...resolve(schema.allOf[0]).properties, ...schema.properties } } : schema);
  const props = root?.properties as Record<string, any> | undefined;
  if (!props) return null;
  const required: string[] = schema?.allOf ? [] : (root.required ?? []);
  return (
    <table className="mt-2 w-full text-left text-sm">
      <tbody>
        {Object.entries(props).map(([name, s]) => (
          <tr key={name} className="border-t border-line align-top">
            <td className="py-1.5 pr-3 font-mono text-[0.8rem] font-semibold">
              {name}
              {required.includes(name) && <span className="text-accent-deep"> *</span>}
            </td>
            <td className="py-1.5 pr-3 font-mono text-[0.8rem] text-muted">{typeLabel(s)}</td>
            <td className="py-1.5 text-muted">{s.description ?? ""}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function curlFor(method: string, path: string, op: any): string {
  const url = `$SITE/api/v1${path.replace(/\{(\w+)\}/g, (_m, p) => `<${p}>`)}`;
  const secured = Boolean(op.security);
  const body = op.requestBody?.content?.["application/json"]?.schema;
  const example = body ? resolve(body)?.example : undefined;
  const lines = [`curl -X ${method.toUpperCase()} "${url}"`];
  if (secured) lines.push('  -H "Authorization: Bearer $ADMIN_API_KEY"');
  if (body) {
    lines.push('  -H "Content-Type: application/json"');
    lines.push(`  -d '${JSON.stringify(example ?? {}, null, 2).replace(/\n/g, "\n     ")}'`);
  }
  return lines.join(" \\\n");
}

export default function ApiDocsPage() {
  const tags: string[] = spec.tags.map((t: any) => t.name);
  const ops = Object.entries(spec.paths).flatMap(([path, item]: [string, any]) =>
    METHODS.filter((m) => item[m]).map((m) => ({ path, method: m, op: { ...item[m], parameters: [...(item.parameters ?? []), ...(item[m].parameters ?? [])] } })),
  );

  return (
    <div className="min-h-screen bg-cream text-ink">
      <header className="border-b-2 border-ink bg-paper">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-8">
          <Link href="/" className="font-display text-lg font-extrabold">
            Tactyqal Labs <span className="text-muted">/ Blog API</span>
          </Link>
          <nav className="flex gap-4 text-sm font-semibold">
            <Link href="/blog" className="hover:underline">Blog</Link>
            <Link href="/admin" className="hover:underline">Admin</Link>
            <a href="/api/v1/openapi.json" className="rounded-full border-2 border-ink bg-accent px-4 py-1.5">openapi.json</a>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
        <h1 className="font-display text-4xl font-extrabold">{spec.info.title}</h1>
        <p className="mt-1 text-sm font-semibold text-muted">
          OpenAPI {spec.openapi} &middot; v{spec.info.version} &middot; base path <code className="font-mono">/api/v1</code>
        </p>
        <div className="mt-5 max-w-3xl space-y-3 text-muted">
          {spec.info.description.split("\n\n").map((p: string) => (
            <p key={p} dangerouslySetInnerHTML={{ __html: p.replace(/\*\*(.+?)\*\*/g, "<strong class='text-ink'>$1</strong>").replace(/`(.+?)`/g, "<code class='rounded bg-sand px-1 font-mono text-[0.85em]'>$1</code>") }} />
          ))}
        </div>

        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            ["Envelope", "{ data, meta } on success; { error: { code, message, details } } on failure."],
            ["Auth", "Bearer ADMIN_API_KEY, or the httpOnly session cookie from POST /auth/login. Reads are public."],
            ["Concurrency", "Send If-Match: \"<version>\" (or version in the body). A stale write gets 409 version_conflict."],
          ].map(([t, d]) => (
            <div key={t} className="rounded-2xl border-2 border-ink bg-paper p-4 shadow-card">
              <h2 className="font-display text-base font-extrabold">{t}</h2>
              <p className="mt-1 text-sm text-muted">{d}</p>
            </div>
          ))}
        </section>

        {tags.map((tag) => {
          const group = ops.filter((o) => o.op.tags?.includes(tag));
          if (!group.length) return null;
          return (
            <section key={tag} className="mt-12">
              <h2 className="font-display text-2xl font-extrabold">{tag}</h2>
              <div className="mt-4 space-y-3">
                {group.map(({ path, method, op }) => (
                  <details key={method + path} className="group rounded-2xl border-2 border-ink bg-paper open:shadow-card">
                    <summary className="flex cursor-pointer list-none flex-wrap items-center gap-3 px-4 py-3">
                      <span className={`w-16 rounded-md py-0.5 text-center font-mono text-xs font-bold uppercase ${BADGE[method]}`}>{method}</span>
                      <code className="font-mono text-sm font-semibold">/api/v1{path}</code>
                      <span className="text-sm text-muted">{op.summary}</span>
                      {op.security && <span className="ml-auto rounded-full bg-ink px-2.5 py-0.5 text-xs font-semibold text-cream">auth</span>}
                    </summary>
                    <div className="space-y-4 border-t-2 border-line px-4 py-4 text-sm">
                      {op.description && <p className="text-muted">{op.description}</p>}
                      {op.parameters.length > 0 && (
                        <div>
                          <h3 className="font-bold">Parameters</h3>
                          <table className="mt-2 w-full text-left">
                            <tbody>
                              {op.parameters.map((p: any) => (
                                <tr key={p.in + p.name} className="border-t border-line align-top">
                                  <td className="py-1.5 pr-3 font-mono text-[0.8rem] font-semibold">{p.name}</td>
                                  <td className="py-1.5 pr-3 text-xs uppercase tracking-wide text-muted">{p.in}</td>
                                  <td className="py-1.5 pr-3 font-mono text-[0.8rem] text-muted">{typeLabel(p.schema)}</td>
                                  <td className="py-1.5 text-muted">{p.description ?? ""}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                      {op.requestBody && (
                        <div>
                          <h3 className="font-bold">Request body <span className="font-normal text-muted">(application/json)</span></h3>
                          <Props schema={op.requestBody.content["application/json"].schema} />
                        </div>
                      )}
                      <div>
                        <h3 className="font-bold">Responses</h3>
                        <ul className="mt-2 space-y-1">
                          {Object.entries(op.responses).map(([code, r]: [string, any]) => (
                            <li key={code} className="flex gap-3">
                              <span className={`w-10 font-mono font-bold ${code.startsWith("2") ? "text-sage-deep" : "text-accent-deep"}`}>{code}</span>
                              <span className="text-muted">{r.description}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h3 className="font-bold">Example</h3>
                        <pre className="mt-2 overflow-x-auto rounded-xl bg-ink p-4 font-mono text-[0.8rem] leading-relaxed text-cream">{curlFor(method, path, op)}</pre>
                      </div>
                    </div>
                  </details>
                ))}
              </div>
            </section>
          );
        })}

        <section className="mt-14">
          <h2 className="font-display text-2xl font-extrabold">Schemas</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {Object.entries(spec.components.schemas).map(([name, schema]: [string, any]) => (
              <div key={name} className="rounded-2xl border-2 border-ink bg-paper p-4">
                <h3 className="font-mono font-bold">{name}</h3>
                <Props schema={schema} />
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
