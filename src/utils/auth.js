export const USER_ROLES = {
  CUSTOMER: 'customer',
  DELIVERY: 'delivery',
  ADMIN: 'admin',
};

export function normalizeUserRole(role) {
  if (role === USER_ROLES.DELIVERY) return USER_ROLES.DELIVERY;
  if (role === USER_ROLES.ADMIN) return USER_ROLES.ADMIN;
  return USER_ROLES.CUSTOMER;
}

export function getRoleLabel(role) {
  const normalized = normalizeUserRole(role);
  if (normalized === USER_ROLES.DELIVERY) return 'Delivery Partner';
  if (normalized === USER_ROLES.ADMIN) return 'Admin';
  return 'Customer';
}

export function getDefaultUserName(role) {
  const normalized = normalizeUserRole(role);
  if (normalized === USER_ROLES.DELIVERY) return 'Delivery Partner';
  if (normalized === USER_ROLES.ADMIN) return 'Admin';
  return 'Customer';
}
