import { logger } from "@/adapters";
import { reloadAllAddons } from "@/addons/addons-core";
import { createAddonContext } from "./addons-runtime-context";

interface DevModeConfig {
  enabled: boolean;
  watchPaths: string[];
  pollInterval: number;
  autoReload: boolean;
}

interface AddonDevServer {
  id: string;
  name: string;
  url: string;
  port: number;
  status: "running" | "stopped" | "error";
  lastUpdated?: Date;
}

/**
 * Manages addon development mode, including hot reloading and discovery of development servers.
 *
 * This class is a singleton, with a global instance exported as `addonDevManager`.
 */
class AddonDevManager {
  private config: DevModeConfig;
  private devServers = new Map<string, AddonDevServer>();
  private watchInterval: number | null = null;
  private eventSource: EventSource | null = null;

  constructor() {
    this.config = {
      enabled: import.meta.env.DEV || false,
      watchPaths: [],
      pollInterval: 1000,
      autoReload: true,
    };

    // Note: Auto-discovery is now done lazily when enableDevMode() is called
    // This prevents side effects during module import
  }

  /**
   * Auto-discovers running addon development servers on common ports.
   * It sends a health check request to each port and, if successful, tries to
   * fetch the addon's manifest to identify and register it.
   */
  private async discoverDevServers(): Promise<void> {
    const commonPorts = [3001];

    logger.info("🔍 Auto-discovering addon development servers...");

    for (const port of commonPorts) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);

        const response = await fetch(`http://localhost:${port}/health`, {
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          // Try to get manifest to identify the addon
          try {
            const manifestResponse = await fetch(`http://localhost:${port}/manifest.json`);
            if (manifestResponse.ok) {
              const manifest = (await manifestResponse.json()) as {
                id: string;
                name: string;
              };

              this.registerDevServer({
                id: manifest.id,
                name: manifest.name,
                port: port,
              });

              logger.info(`✅ Discovered dev server: ${manifest.name} on port ${port}`);
            }
          } catch (_manifestError) {
            // No manifest, might not be an addon server
          }
        }
      } catch (_error) {
        // Server not running on this port, continue
      }
    }
  }

  /**
   * Enables addon development mode.
   *
   * This function discovers running dev servers, starts file watching for hot
   * reloading, sets up a connection to the hot reload server, and injects
   * development tools into the addon context.
   */
  async enableDevMode(): Promise<void> {
    if (!this.config.enabled) {
      logger.info("🔧 Enabling addon development mode...");
      this.config.enabled = true;
    }

    // Always re-discover servers when explicitly enabling
    await this.discoverDevServers();

    // Start file watching
    this.startWatching();

    // Setup hot reload endpoint
    this.setupHotReloadServer();

    // Add dev tools to context
    this.injectDevTools();

    logger.info("✅ Addon development mode enabled");
  }

  /**
   * Disables addon development mode.
   *
   * This stops the file watcher and cleans up any resources used by the
   * development mode, such as the hot reload server connection.
   */
  disableDevMode(): void {
    if (this.config.enabled) {
      logger.info("🔧 Disabling addon development mode...");
      this.config.enabled = false;

      this.stopWatching();
      this.cleanup();

      logger.info("✅ Addon development mode disabled");
    }
  }

  /**
   * Registers a development server for an addon.
   *
   * @param addon An object containing the addon's ID, name, and port.
   */
  registerDevServer(addon: { id: string; name: string; port: number }): void {
    const devServer: AddonDevServer = {
      id: addon.id,
      name: addon.name,
      url: `http://localhost:${addon.port}`,
      port: addon.port,
      status: "stopped",
    };

    this.devServers.set(addon.id, devServer);
    logger.info(`📝 Registered dev server for ${addon.name} at port ${addon.port}`);
  }

  /**
   * Loads an addon from its development server.
   *
   * It fetches the addon's code and manifest from the dev server, and then
   * executes the code in a sandboxed environment.
   *
   * @param addonId The ID of the addon to load.
   * @returns A promise that resolves to `true` if the addon was loaded successfully, or `false` otherwise.
   */
  async loadAddonFromDevServer(addonId: string): Promise<boolean> {
    const devServer = this.devServers.get(addonId);
    if (!devServer) {
      logger.error(`No dev server registered for addon: ${addonId}`);
      return false;
    }

    try {
      // Check if dev server is running
      const response = await fetch(`${devServer.url}/health`);
      if (!response.ok) {
        throw new Error(`Dev server not responding: ${response.status}`);
      }

      // Load addon code from dev server
      const addonResponse = await fetch(`${devServer.url}/addon.js`);
      if (!addonResponse.ok) {
        throw new Error(`Failed to load addon code: ${addonResponse.status}`);
      }

      const addonCode = await addonResponse.text();

      // Load manifest
      const manifestResponse = await fetch(`${devServer.url}/manifest.json`);
      const manifest = manifestResponse.ok ? await manifestResponse.json() : null;

      // Execute addon code in development context
      await this.executeAddonCode(addonCode, manifest, addonId);

      devServer.status = "running";
      devServer.lastUpdated = new Date();

      logger.info(`🚀 Loaded addon ${devServer.name} from dev server`);
      return true;
    } catch (error) {
      devServer.status = "error";
      logger.error(`❌ Failed to load addon from dev server: ${error}`);
      return false;
    }
  }

  /**
   * Executes addon code in a sandboxed environment.
   *
   * It creates a blob URL from the addon code, dynamically imports it, and then
   * executes the addon's default export as a function, passing it an
   * addon-specific context.
   *
   * @param code The addon's JavaScript code.
   * @param _manifest The addon's manifest (currently unused).
   * @param addonId The ID of the addon.
   */
  private async executeAddonCode(code: string, _manifest: unknown, addonId: string): Promise<void> {
    try {
      // Runtime guard: Verify React singletons are available
      const g = globalThis as unknown as { ReactDOM?: { createPortal?: unknown } };
      if (typeof g.ReactDOM?.createPortal !== "function") {
        throw new Error(
          "Host did not expose ReactDOM.createPortal. Portal-based UI components will not work.",
        );
      }

      // Create a blob URL for the addon code
      const blob = new Blob([code], { type: "text/javascript" });
      const blobUrl = URL.createObjectURL(blob);

      // Import and execute the addon
      const mod = await import(/* @vite-ignore */ blobUrl);

      if (typeof mod.default === "function") {
        // Create addon-specific context with scoped secrets
        const addonSpecificContext = createAddonContext(addonId);
        const addonInstance = mod.default(addonSpecificContext);

        // Store for cleanup
        if (addonInstance && typeof addonInstance.disable === "function") {
          const g2 = globalThis as unknown as {
            __DEV_ADDONS__?: Map<string, { disable?: () => void }>;
          };
          g2.__DEV_ADDONS__ = g2.__DEV_ADDONS__ ?? new Map();
          g2.__DEV_ADDONS__.set(addonId, addonInstance);
        }
      }

      // Cleanup blob URL
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      logger.error(`Failed to execute addon code for ${addonId}: ${error}`);
      throw error;
    }
  }

  /**
   * Starts the file watcher for hot reloading.
   * It uses a polling mechanism to check for updates from the dev servers.
   */
  private startWatching(): void {
    if (this.watchInterval) return;

    // Use polling for simplicity - could be enhanced with native file watchers
    this.watchInterval = window.setInterval(() => {
      this.checkForUpdates();
    }, this.config.pollInterval);
  }

  /**
   * Stops the file watcher.
   */
  private stopWatching(): void {
    if (this.watchInterval) {
      clearInterval(this.watchInterval);
      this.watchInterval = null;
    }
  }

  /**
   * Checks for updates from the registered development servers.
   * If an update is detected, it triggers a reload of the addon.
   */
  private async checkForUpdates(): Promise<void> {
    for (const [addonId, devServer] of this.devServers) {
      if (devServer.status !== "running") continue;

      try {
        const response = await fetch(`${devServer.url}/status`);
        if (response.ok) {
          const status = await response.json();

          if (status.lastModified && devServer.lastUpdated) {
            const lastModified = new Date(status.lastModified);
            if (lastModified > devServer.lastUpdated) {
              logger.info(`🔄 Detected changes in ${devServer.name}, auto-reloading...`);
              await this.reloadAddon(addonId);
            }
          }
        }
      } catch (_error) {
        // Silent fail for polling - dev server might be down
      }
    }
  }

  /**
   * Reloads a specific addon.
   *
   * It cleans up the existing instance of the addon, and then reloads it from
   * the development server.
   *
   * @param addonId The ID of the addon to reload.
   */
  private async reloadAddon(addonId: string): Promise<void> {
    try {
      // Clean up existing instance
      const devAddons = (
        globalThis as unknown as {
          __DEV_ADDONS__?: Map<string, { disable?: () => void }>;
        }
      ).__DEV_ADDONS__;
      if (devAddons?.has(addonId)) {
        const instance = devAddons.get(addonId);
        if (instance?.disable) {
          logger.info(`🧹 Cleaning up old instance of ${addonId}`);
          instance.disable();
        }
        devAddons.delete(addonId);
      }

      // Also clean up from the main addon loader
      const { unloadAddon } = await import("./addons-core");
      if (unloadAddon) {
        unloadAddon(addonId);
      }

      // Small delay to ensure cleanup is complete
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Reload from dev server
      const success = await this.loadAddonFromDevServer(addonId);

      if (success) {
        logger.info(`✅ Successfully hot-reloaded ${addonId}`);

        // Trigger navigation update to refresh the UI
        const { triggerNavigationUpdate } = await import("./addons-runtime-context");
        if (triggerNavigationUpdate) {
          triggerNavigationUpdate();
        }
      } else {
        logger.error(`❌ Failed to reload ${addonId}`);
      }
    } catch (error) {
      logger.error(`❌ Error during hot reload of ${addonId}: ${error}`);
    }
  }

  /**
   * Sets up a connection to the hot reload server using Server-Sent Events (SSE).
   * When an `addon-changed` event is received, it triggers a reload of the specified addon.
   */
  private setupHotReloadServer(): void {
    // Connect to hot reload server if available
    if (typeof EventSource !== "undefined") {
      try {
        this.eventSource = new EventSource("http://localhost:3001/addon-updates");

        this.eventSource.onmessage = (event) => {
          const data = JSON.parse(event.data) as { type?: string; addonId?: string };
          if (data.type === "addon-changed" && data.addonId) {
            this.reloadAddon(data.addonId);
          }
        };

        this.eventSource.onerror = () => {
          // Hot reload server not available - that's fine
        };
      } catch (_error) {
        // EventSource not available or failed
      }
    }
  }

  /**
   * Injects development tools into the addon context.
   * This provides addons with a `dev` object on their context, which contains
   * functions for reloading, listing dev servers, and controlling auto-reloading.
   */
  private injectDevTools(): void {
    // Add development-specific APIs to a generic context
    const devCtx = createAddonContext("dev-tools");
    (
      devCtx as unknown as {
        dev?: {
          reload: () => Promise<void> | void;
          listServers: () => unknown[];
          enableAutoReload: () => void;
          disableAutoReload: () => void;
        };
      }
    ).dev = {
      reload: () => reloadAllAddons(),
      listServers: () => Array.from(this.devServers.values()),
      enableAutoReload: () => {
        this.config.autoReload = true;
      },
      disableAutoReload: () => {
        this.config.autoReload = false;
      },
    };
  }

  /**
   * Cleans up resources used by the development mode.
   * This includes closing the hot reload server connection and disabling any
   * running development addons.
   */
  private cleanup(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    // Clean up dev addon instances
    const devAddons = (
      globalThis as unknown as {
        __DEV_ADDONS__?: Map<string, { disable?: () => void }>;
      }
    ).__DEV_ADDONS__;
    if (devAddons) {
      for (const [, instance] of devAddons) {
        if (instance.disable) {
          instance.disable();
        }
      }
      devAddons.clear();
    }
  }

  /**
   * Manually triggers the discovery and registration of development servers.
   */
  async discoverAndRegister(): Promise<void> {
    await this.discoverDevServers();
  }

  /**
   * Gets the current status of the development mode.
   *
   * @returns An object containing the enabled status, a list of registered dev servers, and the auto-reload status.
   */
  getStatus() {
    return {
      enabled: this.config.enabled,
      servers: Array.from(this.devServers.values()),
      autoReload: this.config.autoReload,
    };
  }

  /**
   * Toggles the development mode on or off.
   *
   * @returns `true` if development mode is now enabled, `false` otherwise.
   */
  toggleDevMode(): boolean {
    if (this.config.enabled) {
      this.disableDevMode();
    } else {
      this.enableDevMode();
    }
    return this.config.enabled;
  }

  /**
   * Checks if development mode is currently enabled.
   *
   * @returns `true` if development mode is enabled, `false` otherwise.
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Forcibly disables development mode.
   */
  forceDisable(): void {
    if (this.config.enabled) {
      logger.info("🔧 Force disabling addon development mode...");
      this.disableDevMode();
    }
  }

  /**
   * Forcibly enables development mode, if not already enabled and in a development environment.
   */
  forceEnable(): void {
    if (!this.config.enabled && import.meta.env.DEV) {
      logger.info("🔧 Force enabling addon development mode...");
      this.enableDevMode();
    }
  }
}

// Global instance
export const addonDevManager = new AddonDevManager();

// Note: Development mode initialization is now done explicitly in main.tsx
// to avoid side effects during module imports

// Make debugging tools available globally in development mode
if (import.meta.env.DEV) {
  // Make available globally for debugging (dev only)
  (globalThis as unknown as { __ADDON_DEV__?: unknown }).__ADDON_DEV__ = addonDevManager;

  // Add global helper functions (dev only)
  (globalThis as unknown as { discoverAddons?: () => void }).discoverAddons = () =>
    addonDevManager.discoverAndRegister();
  (globalThis as unknown as { reloadAddons?: () => void }).reloadAddons = () => reloadAllAddons();
}
