function toKST(dateInput = new Date()) {
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  const kst = new Date(date.getTime() + 9 * 60 * 60 * 1000);

  return kst
    .toISOString()
    .replace('T', ' ')
    .replace('Z', '')
    .slice(0, 19)
    .replace(/-/g, '.');
}

function getKSTParts(dateInput = new Date()) {
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  const kstDate = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  const isoDate = kstDate.toISOString().slice(0, 10);

  return {
    date: isoDate,
    hour: Number(isoDate ? kstDate.toISOString().slice(11, 13) : 0),
    minute: Number(kstDate.toISOString().slice(14, 16)),
    formatted: toKST(date)
  };
}

function subtractHours(dateInput, hours) {
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  return new Date(date.getTime() - hours * 60 * 60 * 1000);
}

module.exports = {
  toKST,
  getKSTParts,
  subtractHours
};
