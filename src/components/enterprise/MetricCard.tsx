import type { ReactNode } from 'react';

export function MetricCard({
  label,
  value,
  detail,
  accent,
}: {
  label: string;
  value: string;
  detail: string;
  accent?: 'cyan' | 'violet' | 'amber' | 'green';
}) {
  const accentClass = accent ? `metric-${accent}` : 'metric-cyan';

  return (
    <div className={`metric-card ${accentClass}`}>
      <p className="metric-label">{label}</p>
      <h3 className="metric-value">{value}</h3>
      <p className="metric-detail">{detail}</p>
    </div>
  );
}

export default MetricCard;
