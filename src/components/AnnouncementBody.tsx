// Renders announcement text: blank lines split paragraphs, "-" lines become bullets,
// a line ending with "៖" or ":" is a sub-heading.
export default function AnnouncementBody({ text }: { text: string }) {
  const blocks = text.split(/\n\s*\n/).map(b => b.split('\n').map(l => l.trim()).filter(Boolean));
  return (
    <div className="space-y-4 text-sm sm:text-base text-slate-700 leading-loose">
      {blocks.map((lines, i) => {
        const bullets = lines.filter(l => l.startsWith('-'));
        const head = lines.filter(l => !l.startsWith('-'));
        return (
          <div key={i} className="space-y-1">
            {head.map((l, j) =>
              /[៖:]$/.test(l) && bullets.length > 0 ? (
                <h2 key={j} className="font-bold text-slate-900">{l}</h2>
              ) : (
                <p key={j}>{l}</p>
              )
            )}
            {bullets.length > 0 && (
              <ul className="list-disc pl-6 space-y-1">
                {bullets.map((l, j) => <li key={j}>{l.replace(/^-\s*/, '')}</li>)}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}
