import { homeFor } from "../services/roles.js";

/**
 * Legacy `/profile` route.
 *
 * Each role panel now owns a profile section that shows the data relevant to it
 * (a patient's EPS and document, a pharmacy's working hours, ...), so this route
 * forwards there instead of rendering a second, thinner copy.
 *
 * It also used to read `user.name`, which the API never returns — the field is
 * `fullName` — so the name rendered as "undefined".
 */
export function renderProfile({ navigate, user }) {
  const home = homeFor(user.role);
  navigate(`${home.replace("/dashboard", "")}/profile`, { replace: true });
}
