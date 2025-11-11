import {
  getRunEnv,
  openCsvFileDialogTauri,
  openFolderDialogTauri,
  openDatabaseFileDialogTauri,
  openFileSaveDialogTauri,
  RUN_ENV,
  logger,
} from "@/adapters";

/**
 * Opens a file dialog to select a CSV file.
 * This is only supported in the desktop environment.
 *
 * @returns {Promise<null | string | string[]>} A promise that resolves with the selected file path(s), or null if the dialog is canceled.
 * @throws Will throw an error if the operation is not supported or fails.
 */
export const openCsvFileDialog = async (): Promise<null | string | string[]> => {
  try {
    switch (getRunEnv()) {
      case RUN_ENV.DESKTOP:
        return openCsvFileDialogTauri();
      case RUN_ENV.WEB:
        throw new Error(`Unsupported in web`);
      default:
        throw new Error(`Unsupported`);
    }
  } catch (error) {
    logger.error("Error open csv file.");
    throw error;
  }
};

/**
 * Opens a dialog to select a folder.
 * This is only supported in the desktop environment.
 *
 * @returns {Promise<string | null>} A promise that resolves with the selected folder path, or null if the dialog is canceled.
 * @throws Will throw an error if the operation is not supported or fails.
 */
export const openFolderDialog = async (): Promise<string | null> => {
  try {
    switch (getRunEnv()) {
      case RUN_ENV.DESKTOP:
        return openFolderDialogTauri();
      case RUN_ENV.WEB:
        throw new Error(`Unsupported in web`);
      default:
        throw new Error(`Unsupported`);
    }
  } catch (error) {
    logger.error("Error opening folder dialog.");
    throw error;
  }
};

/**
 * Opens a file dialog to select a database file.
 * This is only supported in the desktop environment.
 *
 * @returns {Promise<string | null>} A promise that resolves with the selected file path, or null if the dialog is canceled.
 * @throws Will throw an error if the operation is not supported or fails.
 */
export const openDatabaseFileDialog = async (): Promise<string | null> => {
  try {
    switch (getRunEnv()) {
      case RUN_ENV.DESKTOP:
        return openDatabaseFileDialogTauri();
      case RUN_ENV.WEB:
        throw new Error(`Unsupported in web`);
      default:
        throw new Error(`Unsupported`);
    }
  } catch (error) {
    logger.error("Error opening database file dialog.");
    throw error;
  }
};

/**
 * Opens a file save dialog to download content.
 * This is only supported in the desktop environment.
 *
 * @param {Uint8Array | Blob | string} fileContent - The content to save.
 * @param {string} fileName - The default file name.
 * @returns {Promise<void>} A promise that resolves when the file is saved.
 * @throws Will throw an error if the operation is not supported or fails.
 */
export async function openFileSaveDialog(
  fileContent: Uint8Array | Blob | string,
  fileName: string,
) {
  switch (getRunEnv()) {
    case RUN_ENV.DESKTOP:
      return openFileSaveDialogTauri(fileContent, fileName);
    case RUN_ENV.WEB:
      throw new Error(`Unsupported environment for file download`);
    default:
      throw new Error(`Unsupported environment for file download`);
  }
}
