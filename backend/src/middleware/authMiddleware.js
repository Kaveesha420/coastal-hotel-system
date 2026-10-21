
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma.js";

export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Authentication required. Please log in.",
    });
  }

  const token = authHeader.slice(7);

  let payload;

  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired login token. Please log in again.",
    });
  }

  if (
    typeof payload === "string" ||
    !payload.sub ||
    !Number.isInteger(Number(payload.sub))
  ) {
    return res.status(401).json({
      success: false,
      message: "Invalid authentication token.",
    });
  }

  try {
    const user = await prisma.user.findUnique({
      where: {
        id: Number(payload.sub),
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Account not found. Please log in again.",
      });
    }

    req.user = user;

    next();
  } catch (error) {
    console.error("Authentication error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to verify authentication.",
    });
  }
}
