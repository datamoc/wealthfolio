#!/usr/bin/env node

/**
 * Development wrapper script
 * Handles graceful shutdown of Vite dev server to prevent ELIFECYCLE errors
 */

import { spawn } from "node:child_process";

let viteProcess = null;
let isShuttingDown = false;

function startVite() {
  console.log("🚀 Starting Vite dev server...");

  const isWindows = process.platform === "win32";

  // On Windows, use cmd.exe to properly execute npx
  // On Unix, use npx directly
  const command = isWindows ? "cmd.exe" : "npx";
  const args = isWindows ? ["/c", "npx", "vite"] : ["vite"];

  viteProcess = spawn(command, args, {
    stdio: "inherit",
    windowsHide: isWindows,
  });

  viteProcess.on("exit", (code, signal) => {
    if (!isShuttingDown) {
      console.log(`Vite exited with code ${code}, signal ${signal}`);
      process.exit(code || 0);
    }
  });

  viteProcess.on("error", (err) => {
    console.error("Failed to start Vite:", err);
    process.exit(1);
  });
}

function shutdown() {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log("\n🛑 Shutting down gracefully...");

  if (viteProcess && viteProcess.pid) {
    const isWindows = process.platform === "win32";

    if (isWindows) {
      // On Windows, kill the process tree
      import("node:child_process").then(({ exec }) => {
        exec(`taskkill /pid ${viteProcess.pid} /T /F`, (error) => {
          if (error && !error.message.includes("not found")) {
            console.error("Error during shutdown:", error.message);
          }
          // Exit cleanly regardless
          process.exit(0);
        });
      });
    } else {
      // On Unix, send SIGTERM and wait
      viteProcess.kill("SIGTERM");
      setTimeout(() => {
        if (viteProcess && !viteProcess.killed) {
          viteProcess.kill("SIGKILL");
        }
        process.exit(0);
      }, 1000);
    }
  } else {
    process.exit(0);
  }
}

// Handle shutdown signals
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
process.on("exit", () => {
  if (viteProcess && viteProcess.pid) {
    try {
      viteProcess.kill("SIGKILL");
    } catch (e) {
      // Ignore errors during final cleanup
    }
  }
});

// Start Vite
startVite();
