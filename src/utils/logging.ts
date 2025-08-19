import { DEBUG } from "../../index";

export const logInfo = (message: string) => {
    if (DEBUG) {
        console.log(`[INFO] ${message}`);
    }
};

export const logError = (message: string) => {
    if (DEBUG) {
        console.error(`[ERROR] ${message}`);
    }
};
