// Real child-process lifecycle tests, without loading a native inference model.
process.once("message", ({ pixels }) => {
  if (process.env.LEONARDO_API_KEY || process.env.DATABASE_URL) process.exit(2);
  if (process.env.ORT_DISABLE_TELEMETRY !== "1") process.exit(2);
  const mode = pixels[0];
  if (mode === 1) { setInterval(() => {}, 1000); return; }
  if (mode === 2) { process.send({ ok: true, detections: [{ score: "invalid" }] }); process.exit(0); }
  if (mode === 3) process.exit(1);
  const response = { ok: true, detections: [{ height: 0.1, left: 0.4, score: 0.12, top: 0.5, width: 0.2 }] };
  process.send(response, () => {
    if (mode === 4) setInterval(() => {}, 1000);
    else process.exit(0);
  });
});
