export const formatCurrency = (amount) => `Rs. ${amount.toLocaleString('en-IN')}`;

export const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

export const formatTime = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
};

export const getDiscountPercent = (mrp, price) =>
  mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;

export const getOrderStatusLabel = (status) => {
  const map = {
    placed: 'Order Placed',
    confirmed: 'Confirmed',
    preparing: 'Being Packed',
    out_for_delivery: 'Out for Delivery',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
  };
  return map[status] || status;
};

export const getOrderStatusColor = (status, Colors) => {
  const map = {
    placed: Colors.statusPlaced,
    confirmed: Colors.statusConfirmed,
    preparing: Colors.statusPreparing,
    out_for_delivery: Colors.statusOutForDelivery,
    delivered: Colors.statusDelivered,
    cancelled: Colors.statusCancelled,
  };
  return map[status] || Colors.textSecondary;
};

export const truncate = (str, maxLen = 60) =>
  str.length > maxLen ? str.slice(0, maxLen) + '...' : str;

export const pluralize = (count, singular, plural) =>
  count === 1 ? `${count} ${singular}` : `${count} ${plural}`;
