/** Entry-local context: never use an unrelated history entry's return route. */
export function activityReturnRoute(
  route: string,
  state: unknown,
  previousRoute: string | undefined,
  validRoutes: readonly string[],
  fallback: string,
): string {
  const valid = (value: unknown): value is string =>
    typeof value === "string" && value !== route && validRoutes.includes(value);
  if (state && typeof state === "object" && "mightymaticaNavigation" in state) {
    const entry = state.mightymaticaNavigation;
    if (entry && typeof entry === "object" && "route" in entry && entry.route === route
      && "returnTo" in entry && valid(entry.returnTo)) return entry.returnTo;
  }
  return valid(previousRoute) ? previousRoute : fallback;
}
