#!/usr/bin/env node

(async () => {
  const { runExit } = await import("clipanion");
  const { BuildCommand } = await import("./commands");

  await runExit([BuildCommand]);
})().catch((e) => console.log(e));
