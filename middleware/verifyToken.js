// middleware/verifyToken.js
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

export default function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

  if (!token) return res.status(401).json({ message: "No token provided" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // VERY IMPORTANT:
    req.user = decoded; // decoded = { id, email, iat, exp }

    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}
