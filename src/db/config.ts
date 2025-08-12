import path from "path";
import { extractPathUpToKeyword } from "../utils/directory-path";

// Define the path for the database, resolving it relative to the project's root
export const DB_PATH = path.resolve(process.cwd(), "db");

// Define folders to be ignored during the recursive search for markdown files
export const IGNORED_FOLDERS = [
    "node_modules",
    ".next",
    "dist",
    "storybook-static",
    "coverage",
    "build",
    ".git",
];

export const getProjectRoot = () => {
    let projectRoot: string;
    try {
        projectRoot = extractPathUpToKeyword(
            path.resolve(process.cwd()),
            "pantheon-monorepo"
        );
    } catch (err) {
        console.error(
            "Error extracting project root, defaulting to 'docs':",
            err
        );
        projectRoot = "docs";
    }
    return projectRoot;
};
