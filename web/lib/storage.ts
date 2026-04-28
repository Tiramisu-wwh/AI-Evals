import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

const UPLOAD_ROOT = path.join(process.cwd(), "uploads");

function getExtension(filename: string) {
  const extension = filename.split(".").pop()?.toLowerCase();
  return extension ? `.${extension}` : "";
}

export async function saveUploadedFile(file: File) {
  const extension = getExtension(file.name);
  const storedFilename = `${randomUUID()}${extension}`;
  const relativePath = path.join("uploads", storedFilename);
  const absolutePath = path.join(UPLOAD_ROOT, storedFilename);
  const content = Buffer.from(await file.arrayBuffer());

  await fs.mkdir(UPLOAD_ROOT, { recursive: true });
  await fs.writeFile(absolutePath, content);

  return {
    storedPath: relativePath,
    absolutePath,
  };
}

export function resolveStoredFilePath(storedPath: string) {
  return path.join(UPLOAD_ROOT, path.basename(storedPath));
}
