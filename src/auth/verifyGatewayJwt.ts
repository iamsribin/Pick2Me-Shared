import { Request, Response, NextFunction, RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { AccessPayload } from "./types.js";
import { IRole } from "../interfaces/common-types.js";

declare global {
  namespace Express {
    interface Request {
      gatewayUser?: AccessPayload | null;
    }
  }
}

export function verifyGatewayJwt(strict = true, GATEWAY_SECRET:string, options?: { role?: IRole | IRole[] }): RequestHandler {
      
    if (!GATEWAY_SECRET) {
     console.warn("GATEWAY_SHARED_SECRET is not set. Gateway JWT verification will fail.");
     }
  
    return (req: Request, res: Response, next: NextFunction) => {
    const raw = (req.headers["x-gateway-jwt"] as string | undefined) ?? null;

    if (!raw) {
      if (strict) return res.status(401).json({ message: "Missing gateway token" });
      req.gatewayUser = null;
      return next();
    }

    try {
      const decoded = jwt.verify(raw, GATEWAY_SECRET as string, { issuer: "api-gateway" }) as AccessPayload;

      if (!decoded || typeof decoded !== "object" || !decoded.id || !decoded.role) {
        if (strict) return res.status(401).json({ message: "Invalid gateway token (claims missing)" });
        req.gatewayUser = null;
        return next();
      }

      const gatewayUser: AccessPayload = {
        id: String(decoded.id),
        role: String(decoded.role) as IRole,
      };

      // optional role check
      if (options?.role) {
        const required = Array.isArray(options.role) ? options.role : [options.role];
        if (!required.includes(gatewayUser.role)) {
          if (strict) return res.status(403).json({ message: "Forbidden: role mismatch" });
          req.gatewayUser = null;
          return next();
        }
      }

      req.gatewayUser = gatewayUser;
      return next();
    } catch (err) {
      const message = (err as Error).message || "Invalid gateway token";
      if (strict) return res.status(401).json({ message: `Invalid gateway token: ${message}` });
      req.gatewayUser = null;
      return next();
    }
  };
}
