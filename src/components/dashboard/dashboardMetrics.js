const DAY = 24 * 60 * 60 * 1000;

export function valueIsTrue(value) {
  return value === true || value === 1 || value === '1' || value === 'true';
}

export function dateFromValue(value) {
  if (!value) return null;
  const numeric = Number(value);
  const date = Number.isFinite(numeric)
    ? new Date(numeric > 100000000000 ? numeric : numeric * 1000)
    : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function checkInHealth(value, now = Date.now()) {
  const date = dateFromValue(value);
  if (!date) return { key: 'never', label: 'Never checked in', tone: 'bad', age: Infinity, date: null };
  const age = Math.max(0, now - date.getTime());
  if (age <= DAY) return { key: 'healthy', label: 'Within 24 hours', tone: 'ok', age, date };
  if (age <= 7 * DAY) return { key: 'attention', label: '1–7 days', tone: 'warn', age, date };
  return { key: 'stale', label: 'Over 7 days', tone: 'bad', age, date };
}

export function platformFor(device) {
  const model = `${device?.ModelName || ''} ${device?.Model || ''}`.toLowerCase();
  if (model.includes('appletv') || model.includes('apple tv')) return 'tvOS';
  if (model.includes('vision') || model.includes('reality')) return 'visionOS';
  if (model.includes('mac')) return 'macOS';
  return 'iOS';
}

function collectionSize(value) {
  return Array.isArray(value) ? value.length : value && typeof value === 'object' ? 1 : 0;
}

function configuredValueCount(value) {
  if (!value || typeof value !== 'object') return 0;
  if (Array.isArray(value)) return value.reduce((total, item) => total + configuredValueCount(item), 0);
  return Object.entries(value).reduce((total, [key, item]) => {
    if (['PayloadUUID', 'PayloadType', 'PayloadIdentifier', 'PayloadVersion', '__tdsPlistType'].includes(key)) return total;
    if (Array.isArray(item)) return total + Math.max(1, item.length);
    if (item && typeof item === 'object') return total + configuredValueCount(item);
    return total + 1;
  }, 0);
}

export function profileConfigurationStats(profiles) {
  const stats = { payloads: 0, values: 0, restrictions: 0, wifi: 0, homeScreens: 0, custom: 0 };
  const sections = ['wifi', 'certificates', 'domains', 'loginWindowSettings', 'sharedDeviceSettings', 'restrictionsSettings', 'homeScreenLayoutSettings', 'singleAppModeSettings'];
  (profiles || []).forEach((profile) => {
    sections.forEach((section) => {
      const value = profile?.[section];
      const size = collectionSize(value);
      stats.payloads += size;
      stats.values += configuredValueCount(value);
      if (section === 'wifi') stats.wifi += size;
      if (section === 'homeScreenLayoutSettings') stats.homeScreens += size;
      if (section === 'restrictionsSettings' && value && typeof value === 'object') {
        stats.restrictions += Object.keys(value).filter((key) => !key.startsWith('Payload')).length;
      }
    });
    const custom = Array.isArray(profile?.customPayloads) ? profile.customPayloads : [];
    stats.custom += custom.length;
    stats.payloads += custom.length;
    stats.values += custom.reduce((total, payload) => total + configuredValueCount(payload), 0);
  });
  return stats;
}

export function percent(value, total) {
  return total ? Math.round((value / total) * 100) : 0;
}

export function relativeTime(value, now = Date.now()) {
  const date = dateFromValue(value);
  if (!date) return 'Never';
  const seconds = Math.max(0, Math.round((now - date.getTime()) / 1000));
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
