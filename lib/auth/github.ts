/** GitHub sign-in is offered only when its OAuth app is configured. */
export function isGitHubConfigured(): boolean {
  return !!(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET);
}
