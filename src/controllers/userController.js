const catchAsync = require('../utils/catchAsync');
const {
  createUser,
  login,
  getUserById,
  updateMe,
  changePassword,
  listUsers,
  deleteUser,
} = require('../services/userService');

exports.register = catchAsync(async (req, res) => {
  const user = await createUser(req.body);
  res.status(201).json({ message: 'User registered', user });
});

exports.login = catchAsync(async (req, res) => {
  const { user, token } = await login(req.body.email, req.body.password);
  res.json({ message: 'Login successful', token, user });
});

exports.me = catchAsync(async (req, res) => {
  const user = await getUserById(req.user.id);
  res.json({ user });
});

exports.updateMe = catchAsync(async (req, res) => {
  const user = await updateMe(req.user.id, req.body);
  res.json({ message: 'Profile updated', user });
});

exports.changePassword = catchAsync(async (req, res) => {
  await changePassword(req.user.id, req.body.currentPassword, req.body.newPassword);
  res.json({ message: 'Password changed' });
});

// Admin
exports.list = catchAsync(async (req, res) => {
  const result = await listUsers(req.query);
  res.json(result);
});

exports.remove = catchAsync(async (req, res) => {
  await deleteUser(req.params.id);
  res.status(204).send();
});
