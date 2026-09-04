import fs from "node:fs/promises";
import path from "node:path";
import { config } from "../config.js";

/**
 * Minimal file-backed JSON store. No database, per project requirement:
 * data lives in a plain JSON file on disk and every write is serialized
 * through a per-file promise chain so concurrent requests can't interleave
 * a read-modify-write and corrupt the file.
 */
const writeQueues = new Map();

function queueWrite(filePath, task) {
  const prev = writeQueues.get(filePath) || Promise.resolve();
  const next = prev.then(task, task);
  writeQueues.set(
    filePath,
    next.catch(() => {})
  );
  return next;
}

export function createJsonStore(fileName) {
  const filePath = path.join(config.dataDir, fileName);

  async function read() {
    try {
      const raw = await fs.readFile(filePath, "utf-8");
      return JSON.parse(raw);
    } catch (err) {
      if (err.code === "ENOENT") return [];
      throw err;
    }
  }

  async function write(data) {
    return queueWrite(filePath, async () => {
      const tmpPath = `${filePath}.tmp`;
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(tmpPath, JSON.stringify(data, null, 2), "utf-8");
      await fs.rename(tmpPath, filePath);
    });
  }

  async function update(mutator) {
    return queueWrite(filePath, async () => {
      let current;
      try {
        current = JSON.parse(await fs.readFile(filePath, "utf-8"));
      } catch (err) {
        if (err.code !== "ENOENT") throw err;
        current = [];
      }
      const next = await mutator(current);
      const tmpPath = `${filePath}.tmp`;
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(tmpPath, JSON.stringify(next, null, 2), "utf-8");
      await fs.rename(tmpPath, filePath);
      return next;
    });
  }

  return { read, write, update };
}
