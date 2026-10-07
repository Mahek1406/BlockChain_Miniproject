import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

async function findOrCreateConfiguredAdmin(email, password) {
  if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) return null;
  if (email !== process.env.ADMIN_EMAIL.toLowerCase() || password !== process.env.ADMIN_PASSWORD) return null;
  let admin = await User.findOne({ email }).select("+passwordHash");
  if (!admin) {
    admin = await User.create({
      name: process.env.ADMIN_NAME || "System Administrator",
      email,
      passwordHash: await bcrypt.hash(password, 12),
      role: "ADMIN"
    });
  } else if (admin.role !== "ADMIN" || !(await bcrypt.compare(password, admin.passwordHash))) {
    admin.role = "ADMIN";
    admin.passwordHash = await bcrypt.hash(password, 12);
    await admin.save();
  }
  return admin;
}

function issueToken(user) {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is required");
  }

  return jwt.sign({ userId: user._id.toString(), role: user.role }, process.env.JWT_SECRET, {
    expiresIn: "1d"
  });
}

export async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ success: false, message: "Email is already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, passwordHash });
    return res.status(201).json({
      success: true,
      token: issueToken(user),
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    return next(error);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password, accountType = "POLICYHOLDER" } = req.body;
    const normalizedEmail = email.toLowerCase();
    const configuredAdmin = accountType === "ADMIN" ? await findOrCreateConfiguredAdmin(normalizedEmail, password) : null;
    const user = configuredAdmin || await User.findOne({ email: normalizedEmail }).select("+passwordHash");
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }
    if (accountType === "ADMIN" && user.role !== "ADMIN") {
      return res.status(403).json({ success: false, message: "This account is not an administrator" });
    }

    return res.json({
      success: true,
      token: issueToken(user),
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    return next(error);
  }
}
