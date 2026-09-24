/**
 * The one place the Local environment's infrastructure is described.
 *
 * These values address the stack `pnpm infra:up` starts, as seen from the
 * developer's machine. They are emulator settings and throwaway local tokens,
 * not secrets, which is why they are committed. Every Local default, the
 * database reset guard, and the compose-consistency test read them from here.
 *
 * External credentials (remove.bg, Google, MSG91, AWS) never appear in
 * this file, and a deployed environment refuses every value in it.
 *
 * This module has no imports on purpose: repository scripts load it directly
 * with Node's type stripping, without a build step.
 */
export const LOCAL_INFRASTRUCTURE = {
  googleRedirectUri: "http://localhost:3000/api/auth/google/callback",

  databaseUser: "studiocar",
  databasePassword: "studiocar",
  databaseName: "studiocar",
  databaseUrl: "postgresql://studiocar:studiocar@localhost:5432/studiocar",

  awsRegion: "ap-south-1",
  emulatorAccessKeyId: "studiocarlocal",
  emulatorSecretAccessKey: "studiocarlocal123",

  storageEndpoint: "http://localhost:9000",
  storageBucket: "studiocar-local",

  queueEndpoint: "http://localhost:9324",
  imageQueueName: "studiocar-images",
  imageQueueUrl: "http://localhost:9324/000000000000/studiocar-images",

  sessionSecret: "local-development-session-secret-000000",
  processingDispatchToken: "local-processing-dispatch-token-000000",
  lifecycleCleanupToken: "local-lifecycle-cleanup-token-00000000",
  storageCleanupToken: "local-storage-cleanup-token-0000000000",
} as const;

/**
 * Hosts that can only be the developer's own machine or the local compose
 * network. Any other host is somebody's real infrastructure.
 */
export const LOCAL_SERVICE_HOSTNAMES: ReadonlySet<string> = new Set([
  "localhost",
  "127.0.0.1",
  "::1",
  "[::1]",
  "0.0.0.0",
  "host.docker.internal",
  "postgres",
  "db",
  "minio",
  "elasticmq",
]);
