/**
 * Role names exactly as the backend issues them in the JWT.
 *
 * The router previously compared against "USUARIO", which no role ever matches,
 * so every non-admin fell through to the patient panel — a pharmacy operator
 * logging in landed on the patient dashboard.
 */
export const ROLES = Object.freeze({
  ADMIN: "ADMIN",
  PATIENT: "PATIENT",
  PHARMACY: "PHARMACY_OPERATOR",
  EPS: "EPS_OPERATOR"
});

/** Where each role starts after login. */
const HOME_BY_ROLE = {
  [ROLES.ADMIN]: "/admin/dashboard",
  [ROLES.PATIENT]: "/patient/dashboard",
  [ROLES.PHARMACY]: "/pharmacy/dashboard",
  [ROLES.EPS]: "/eps/dashboard"
};

/** The landing route for a role; falls back to login for an unknown one. */
export function homeFor(role) {
  return HOME_BY_ROLE[role] || "/login";
}

/** The URL prefix a role owns, used to reject cross-role navigation. */
const PREFIX_BY_ROLE = {
  [ROLES.ADMIN]: "/admin",
  [ROLES.PATIENT]: "/patient",
  [ROLES.PHARMACY]: "/pharmacy",
  [ROLES.EPS]: "/eps"
};

/**
 * True when `role` may open `path`.
 *
 * ADMIN is allowed everywhere: the backend already lets it bypass pharmacy and
 * EPS scoping, so the UI would be lying if it blocked navigation the API allows.
 */
export function canAccess(role, path) {
  if (role === ROLES.ADMIN) return true;

  const prefix = PREFIX_BY_ROLE[role];
  if (!prefix) return false;

  const owner = Object.values(PREFIX_BY_ROLE).find((candidate) => path.startsWith(candidate));
  // Shared routes (/profile, /welcome) belong to no role: anyone signed in may open them.
  return !owner || owner === prefix;
}

/** Human label for a role. */
export function roleLabel(role) {
  return (
    {
      [ROLES.ADMIN]: "Administrador",
      [ROLES.PATIENT]: "Paciente",
      [ROLES.PHARMACY]: "Farmacia",
      [ROLES.EPS]: "EPS"
    }[role] || role
  );
}
