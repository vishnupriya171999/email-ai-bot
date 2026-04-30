const PasswordResetToken = require("../models/PasswordResetToken");
const User = require("../models/User");
const { createResetTokenPair, hashResetToken, signAccessToken } = require("../utils/tokens");

function authResponse(user) {
  return {
    token: signAccessToken(user._id),
    user: user.toSafeObject(),
  };
}

async function register(req, res) {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: "Username, email, and password are required." });
  }

  if (String(password).length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters." });
  }

  const existingByEmail = await User.findOne({ email: String(email).toLowerCase() });
  if (existingByEmail) {
    return res.status(409).json({ message: "Email is already registered." });
  }

  const existingByUsername = await User.findOne({ usernameLower: String(username).toLowerCase() });
  if (existingByUsername) {
    return res.status(409).json({ message: "Username is already taken." });
  }

  const user = await User.create({ username, email, password });
  return res.status(201).json(authResponse(user));
}

async function login(req, res) {
  const { email, identifier, password } = req.body;
  const loginIdentifier = email || identifier;

  if (!loginIdentifier || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  const normalizedIdentifier = String(loginIdentifier).trim().toLowerCase();
  const user = await User.findOne({
    $or: [{ email: normalizedIdentifier }, { usernameLower: normalizedIdentifier }],
  });

  if (!user) {
    return res.status(401).json({ message: "Invalid credentials." });
  }

  const validPassword = await user.comparePassword(String(password));
  if (!validPassword) {
    return res.status(401).json({ message: "Invalid credentials." });
  }

  return res.status(200).json(authResponse(user));
}

async function forgotPassword(req, res) {
  const email = String(req.body.email || "").trim().toLowerCase();

  if (!email) {
    return res.status(400).json({ message: "Email is required." });
  }

  const user = await User.findOne({ email });
  const genericMessage = "If the account exists, password reset instructions were generated.";

  if (!user) {
    return res.status(200).json({ message: genericMessage });
  }

  await PasswordResetToken.deleteMany({ user: user._id });
  const { rawToken, tokenHash } = createResetTokenPair();

  const expiresMinutes = Number(process.env.RESET_TOKEN_EXPIRES_MINUTES || 20);
  const expiresAt = new Date(Date.now() + expiresMinutes * 60 * 1000);

  await PasswordResetToken.create({
    user: user._id,
    tokenHash,
    expiresAt,
  });

  const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";
  const resetUrl = `${clientUrl}/reset-password?token=${encodeURIComponent(rawToken)}`;

  return res.status(200).json({
    message: genericMessage,
    // Development-friendly response so frontend can complete reset flow without email provider setup.
    resetToken: rawToken,
    resetUrl,
  });
}

async function resetPassword(req, res) {
  const token = String(req.body.token || "").trim();
  const password = String(req.body.password || "");

  if (!token || !password) {
    return res.status(400).json({ message: "Token and new password are required." });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters." });
  }

  const tokenHash = hashResetToken(token);
  const resetEntry = await PasswordResetToken.findOne({
    tokenHash,
    usedAt: null,
    expiresAt: { $gt: new Date() },
  }).populate("user");

  if (!resetEntry || !resetEntry.user) {
    return res.status(400).json({ message: "Reset token is invalid or expired." });
  }

  const user = resetEntry.user;
  user.password = password;
  await user.save();

  resetEntry.usedAt = new Date();
  await resetEntry.save();
  await PasswordResetToken.deleteMany({ user: user._id, _id: { $ne: resetEntry._id } });

  return res.status(200).json(authResponse(user));
}

async function me(req, res) {
  return res.status(200).json({ user: req.user.toSafeObject() });
}

module.exports = {
  register,
  login,
  forgotPassword,
  resetPassword,
  me,
};
