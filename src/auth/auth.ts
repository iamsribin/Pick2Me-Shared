import jwt from "jsonwebtoken";
import type { JwtPayload } from "jsonwebtoken";

import { InternalError } from "../errors/index.js";

export type AccessPayload = JwtPayload & {
  id: string;
  role: "User" | "Driver" | "Admin";
};

export function generateJwtToken(
  payload: AccessPayload,
  secret: jwt.Secret,
  duration: jwt.SignOptions["expiresIn"] = "1h"
): string {  
  const token = jwt.sign({ id: payload.id, role: payload.role }, secret, {
    expiresIn: duration,
  });

  return token;
}

export function verifyToken(token: string, secret: jwt.Secret) {
  try {
    
    if (!secret) throw InternalError("JWT secret key not provided");
    
    return jwt.verify(token, secret) as JwtPayload;
  } catch (err: unknown) {
    throw err;
  }
}

// export function verifyAccessToken(secret: string): RequestHandler {
//   if (!secret) {
//     throw new Error(
//       "JWT access token secret missing. Call verifyAccessToken(secret) with a secret or set JWT_ACCESS_TOKEN_SECRET in env."
//     );
//   }

//   return async (req, res, next) => {
//     try {
//       // const token = req.headers.authorization?.split(" ")[1];

//       const  token = (req as any).cookies?.accessToken;

//       if (!token) {
//         console.log("No token provided");
        
//         res.status(StatusCode.Forbidden).json({
//           success: false, 
//           message: "No token provided", 
//         });
//         return;
//       }

//       const decoded = jwt.verify(token, secret) as JwtPayload;

//       if (decoded.role !== req.headers["x-user-role"]) {
//         return res
//           .status(StatusCode.Unauthorized)
//           .json({ error: "Unauthorized access" });
//       }

//       const redisClient = RedisService.getInstance();
//       const isBlacklisted = await redisClient.checkBlacklistedToken(decoded.id);
//       console.log("isBlacklisted", isBlacklisted, "id", decoded.id);

//       if (isBlacklisted) {
//         console.log("blacklisted");
        
//         res.clearCookie("refreshToken");
//         res.clearCookie("accessToken");
//         await redisClient.removeBlacklistedToken(decoded.id);
//         return res
//           .status(StatusCode.Forbidden)
//           .json({ message: "Token is blacklisted" });
//       }

//       const payload = {
//         id: decoded.id,
//         role: decoded.role,
//       };

//       req.headers["x-user-payload"] = JSON.stringify(payload);

//       const signed = jwt.sign(payload, secret!, {
//         algorithm: "HS256",
//         expiresIn: "30s",
//         issuer: "api-gateway",
//       });

//       req.headers["x-gateway-jwt"] = signed;

//       return next();
//     } catch (err: unknown) {
//       if (err instanceof jwt.TokenExpiredError) {
//         console.log("token expired");
        
//          res
//           .status(StatusCode.Forbidden)
//           .json({ message: "token expired", reason: "token_expired" });
//           return
//       }
//               console.log("invalid expired");

//        res
//         .status(StatusCode.Forbidden)
//         .json({ message: "Invalid token", reason: "invalid_token" });
//         return
//     }
//   };
// }
