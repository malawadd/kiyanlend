// URL-safe short ID generation utilities
export const generateShortId = (): string => {
  // Generate 8-character URL-safe ID (like "jnnoinhum")
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const isValidShortId = (shortId: string): boolean => {
  return /^[a-z0-9]{8}$/.test(shortId);
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDuration = (months: number): string => {
  if (months === 1) return '1 month';
  if (months < 12) return `${months} months`;
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  
  if (remainingMonths === 0) {
    return years === 1 ? '1 year' : `${years} years`;
  }
  
  const yearStr = years === 1 ? '1 year' : `${years} years`;
  const monthStr = remainingMonths === 1 ? '1 month' : `${remainingMonths} months`;
  return `${yearStr}, ${monthStr}`;
};

export const getStatusColor = (status: string): 'accent' | 'secondary' | 'success' | 'danger' | 'neutral' => {
  switch (status) {
    case 'draft': return 'neutral';
    case 'active': return 'success';
    case 'paused': return 'accent';
    case 'completed': return 'secondary';
    case 'cancelled': return 'danger';
    default: return 'neutral';
  }
};

export const getStatusLabel = (status: string): string => {
  switch (status) {
    case 'draft': return 'Draft';
    case 'active': return 'Active';
    case 'paused': return 'Paused';
    case 'completed': return 'Completed';
    case 'cancelled': return 'Cancelled';
    default: return 'Unknown';
  }
};