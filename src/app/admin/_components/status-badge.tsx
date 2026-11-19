const STYLES: Record<string, string> = {
  published: "bg-sage text-sage-deep",
  scheduled: "bg-sky text-ink",
  draft: "bg-sand text-ink-2",
  archived: "bg-rose text-accent-deep",
  trashed: "bg-ink text-cream",
};

export function StatusBadge({ status, trashed }: { status: string; trashed?: boolean }) {
  const key = trashed ? "trashed" : status;
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold capitalize ${STYLES[key] ?? STYLES.draft}`}>{key}</span>
  );
}
