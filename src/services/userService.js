const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const { env } = require('../config/env');
const ApiError = require('../utils/ApiError');

const generateToken = (payload) =>
  jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });

async function createUser(data) {
  const exists = await User.findOne({ $or: [{ email: data.email }, { username: data.username }] });
  if (exists) throw new ApiError(409, 'User with email or username already exists');
  const user = new User(data);
  await user.save();
  return user;
}

async function login(email, password) {
  const user = await User.findOne({ email, isActive: true }).select('+password');
  if (!user) throw new ApiError(401, 'Invalid credentials');
  const ok = await user.comparePassword(password);
  if (!ok) throw new ApiError(401, 'Invalid credentials');
  user.lastLoginAt = new Date();
  user.failedLoginAttempts = 0;
  await user.save();
  const token = generateToken({ sub: user.id, role: user.role });
  return { user: user.toJSON(), token };
}

async function getUserById(id) {
  const user = await User.findById(id);
  if (!user) throw new ApiError(404, 'User not found');
  return user;
}

async function updateMe(userId, update) {
  const allowed = ['username', 'email'];
  const payload = Object.fromEntries(
    Object.entries(update).filter(([k]) => allowed.includes(k))
  );
  const user = await User.findByIdAndUpdate(userId, payload, { new: true, runValidators: true });
  if (!user) throw new ApiError(404, 'User not found');
  return user;
}

async function changePassword(userId, currentPassword, newPassword) {
  const user = await User.findById(userId).select('+password');
  if (!user) throw new ApiError(404, 'User not found');
  const ok = await user.comparePassword(currentPassword);
  if (!ok) throw new ApiError(400, 'Current password is incorrect');
  user.password = newPassword;
  await user.save();
  return true;
}

async function listUsers({ page = 1, limit = 10, role, search }) {
  const query = {};
  if (role) query.role = role;
  if (search) {
    query.$or = [
      { username: new RegExp(search, 'i') },
      { email: new RegExp(search, 'i') },
    ];
  }

  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    User.find(query).skip(skip).limit(limit).sort({ createdAt: -1 }),
    User.countDocuments(query),
  ]);

  return {
    items,
    page: Number(page),
    limit: Number(limit),
    total,
    pages: Math.ceil(total / limit) || 1,
  };
}

async function deleteUser(id) {
  const res = await User.findByIdAndDelete(id);
  if (!res) throw new ApiError(404, 'User not found');
  return true;
}

module.exports = {
  createUser,
  login,
  getUserById,
  updateMe,
  changePassword,
  listUsers,
  deleteUser,
  generateToken,
};
