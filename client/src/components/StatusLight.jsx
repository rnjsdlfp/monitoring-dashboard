const statusMap = {
  green: {
    dotClassName: 'bg-green-500 animate-pulse',
    label: '정상'
  },
  yellow: {
    dotClassName: 'bg-yellow-500',
    label: '경고'
  },
  red: {
    dotClassName: 'bg-red-500 animate-pulse',
    label: '오류'
  },
  na: {
    dotClassName: 'bg-slate-500',
    label: 'N/A'
  }
};

function StatusLight({ status }) {
  const config = statusMap[status] || statusMap.na;

  return (
    <div className="flex items-center justify-center gap-2" title={config.label}>
      <span className={`h-3 w-3 rounded-full ${config.dotClassName}`} />
      <span className="text-sm text-slate-600 dark:text-dark-muted">{config.label}</span>
    </div>
  );
}

export default StatusLight;
