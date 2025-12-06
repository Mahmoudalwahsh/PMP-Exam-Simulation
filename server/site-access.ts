import { promises as fs } from "fs";
import path from "path";

const CONFIG_FILE = path.join(process.cwd(), "data", "site-config.json");

interface SiteConfig {
  accessCode: string;
}

const DEFAULT_CONFIG: SiteConfig = {
  accessCode: "PMP2024"
};

async function ensureConfigFile(): Promise<void> {
  const dataDir = path.dirname(CONFIG_FILE);
  
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
  
  try {
    await fs.access(CONFIG_FILE);
  } catch {
    await fs.writeFile(CONFIG_FILE, JSON.stringify(DEFAULT_CONFIG, null, 2));
  }
}

export async function getAccessCode(): Promise<string> {
  await ensureConfigFile();
  
  try {
    const content = await fs.readFile(CONFIG_FILE, "utf-8");
    const config: SiteConfig = JSON.parse(content);
    return config.accessCode || DEFAULT_CONFIG.accessCode;
  } catch {
    return DEFAULT_CONFIG.accessCode;
  }
}

export async function setAccessCode(newCode: string): Promise<boolean> {
  await ensureConfigFile();
  
  try {
    const content = await fs.readFile(CONFIG_FILE, "utf-8");
    const config: SiteConfig = JSON.parse(content);
    config.accessCode = newCode;
    await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2));
    return true;
  } catch (error) {
    console.error("Error setting access code:", error);
    return false;
  }
}

export async function verifyAccessCode(code: string): Promise<boolean> {
  const currentCode = await getAccessCode();
  return code === currentCode;
}
