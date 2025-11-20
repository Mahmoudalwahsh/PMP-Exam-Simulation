import { Request, Response, NextFunction } from "express";

declare module "express-session" {
  interface Session {
    adminId?: string;
    username?: string;
  }
}

declare global {
  namespace Express {
    interface Request {
      adminId?: string;
      username?: string;
    }
  }
}

export function isAdminAuthenticated(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const adminId = req.session?.adminId;
  const username = req.session?.username;

  if (!adminId || !username) {
    return res.status(401).json({ error: "Unauthorized - Please login" });
  }

  req.adminId = adminId;
  req.username = username;
  next();
}
