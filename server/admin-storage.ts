import { promises as fs } from "fs";
import path from "path";
import bcrypt from "bcrypt";

export interface Admin {
  id: string;
  username: string;
  passwordHash: string;
}

export class AdminStorage {
  private adminsFile: string;

  constructor() {
    this.adminsFile = path.join(process.cwd(), "data", "admins.json");
    this.ensureAdminsFile();
  }

  private async ensureAdminsFile() {
    try {
      await fs.access(this.adminsFile);
    } catch {
      // Create data directory and admins file
      const dataDir = path.dirname(this.adminsFile);
      await fs.mkdir(dataDir, { recursive: true });

      // Hash default password "admin123"
      const defaultPassword = "admin123";
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(defaultPassword, salt);

      const admins: Admin[] = [
        {
          id: "admin-1",
          username: "admin",
          passwordHash,
        },
      ];

      await fs.writeFile(this.adminsFile, JSON.stringify(admins, null, 2));
      console.log(
        `Created admins file with default admin (username: admin, password: admin123)`
      );
    }
  }

  async getAdmin(username: string): Promise<Admin | null> {
    try {
      const content = await fs.readFile(this.adminsFile, "utf-8");
      const admins: Admin[] = JSON.parse(content);
      return admins.find((a) => a.username === username) || null;
    } catch (error) {
      console.error("Error reading admins file:", error);
      return null;
    }
  }

  async verifyPassword(
    username: string,
    password: string
  ): Promise<boolean> {
    try {
      const admin = await this.getAdmin(username);
      if (!admin) return false;
      return await bcrypt.compare(password, admin.passwordHash);
    } catch (error) {
      console.error("Error verifying password:", error);
      return false;
    }
  }
}

export const adminStorage = new AdminStorage();
