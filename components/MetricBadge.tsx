import styles from './MetricBadge.module.css';

interface MetricBadgeProps {
  label: string;
  value: string | number;
}

export default function MetricBadge({ label, value }: MetricBadgeProps) {
  return (
    <div className={styles.badge}>
      <div className={styles.value}>{value}</div>
      <div className={styles.label}>{label}</div>
    </div>
  );
}
