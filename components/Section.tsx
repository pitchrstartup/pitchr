export function Section({ label, content }: { label: string; content: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5">
        {label}
      </p>
      <p className="text-sm text-text-primary leading-relaxed">{content}</p>
    </div>
  );
}
