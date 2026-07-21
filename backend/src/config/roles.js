/**
 * Canonical role names, matching the `roles` table exactly.
 *
 * Naming note: the domain roles "pharmacy" and "EPS" are stored as
 * PHARMACY_OPERATOR and EPS_OPERATOR, because a role identifies a *person* who
 * operates on behalf of that organisation, not the organisation itself. These
 * names are baked into issued JWTs and existing clients, so they are kept as-is.
 */
export const ROLES = Object.freeze({
  ADMIN: 'ADMIN',
  PATIENT: 'PATIENT',
  PHARMACY: 'PHARMACY_OPERATOR',
  EPS: 'EPS_OPERATOR',
});

/** Every valid role name. */
export const ALL_ROLES = Object.freeze(Object.values(ROLES));

/** Roles that act on behalf of an organisation (i.e. not patients). */
export const STAFF_ROLES = Object.freeze([ROLES.ADMIN, ROLES.EPS, ROLES.PHARMACY]);
