export function dashboardDemoEnabled(
  value = import.meta.env.VITE_DASHBOARD_DEMO_MODE,
  msw = import.meta.env.VITE_USE_MSW,
): boolean {
  return msw === 'true' && value !== 'false'
}
