const mongoose = require('mongoose');
const userService = require('../src/services/userService');
const User = require('../src/models/userModel');

// Test database
const MONGODB_URI = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/user_management_test';

describe('User Service', () => {
  let testUser;

  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

  beforeEach(async () => {
    // Clean database before each test
    await User.deleteMany({});

    // Create test user
    testUser = await User.create({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      password: 'password123',
      role: 'user'
    });
  });

  afterAll(async () => {
    // Clean up and close connection
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  describe('getUserById', () => {
    it('should get user by valid id', async () => {
      const user = await userService.getUserById(testUser._id);

      expect(user).toBeTruthy();
      expect(user._id.toString()).toBe(testUser._id.toString());
      expect(user.email).toBe(testUser.email);
      expect(user.password).toBeUndefined(); // Password should not be included
    });

    it('should return null for invalid id', async () => {
      const invalidId = new mongoose.Types.ObjectId();
      const user = await userService.getUserById(invalidId);

      expect(user).toBeNull();
    });

    it('should throw error for malformed id', async () => {
      await expect(userService.getUserById('invalid-id')).rejects.toThrow();
    });
  });

  describe('getUserByEmail', () => {
    it('should get user by email without password', async () => {
      const user = await userService.getUserByEmail(testUser.email);

      expect(user).toBeTruthy();
      expect(user.email).toBe(testUser.email);
      expect(user.password).toBeUndefined();
    });

    it('should get user by email with password when requested', async () => {
      const user = await userService.getUserByEmail(testUser.email, true);

      expect(user).toBeTruthy();
      expect(user.email).toBe(testUser.email);
      expect(user.password).toBeDefined();
    });

    it('should return null for non-existent email', async () => {
      const user = await userService.getUserByEmail('nonexistent@example.com');

      expect(user).toBeNull();
    });

    it('should be case insensitive', async () => {
      const user = await userService.getUserByEmail('JOHN@EXAMPLE.COM');

      expect(user).toBeTruthy();
      expect(user.email).toBe(testUser.email);
    });
  });

  describe('createUser', () => {
    it('should create a new user', async () => {
      const userData = {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        password: 'password123'
      };

      const user = await userService.createUser(userData);

      expect(user).toBeTruthy();
      expect(user.email).toBe(userData.email);
      expect(user.firstName).toBe(userData.firstName);
      expect(user.lastName).toBe(userData.lastName);
      expect(user.password).toBeUndefined(); // Password should not be returned
      expect(user.role).toBe('user'); // Default role
      expect(user.isActive).toBe(true); // Default active state
    });

    it('should not create user with existing email', async () => {
      const userData = {
        firstName: 'Jane',
        lastName: 'Smith',
        email: testUser.email, // Same email as existing user
        password: 'password123'
      };

      await expect(userService.createUser(userData)).rejects.toThrow('already exists');
    });

    it('should not create user with invalid email', async () => {
      const userData = {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'invalid-email',
        password: 'password123'
      };

      await expect(userService.createUser(userData)).rejects.toThrow();
    });

    it('should not create user without required fields', async () => {
      const userData = {
        email: 'jane@example.com',
        password: 'password123'
        // Missing firstName and lastName
      };

      await expect(userService.createUser(userData)).rejects.toThrow();
    });
  });

  describe('updateUser', () => {
    it('should update user successfully', async () => {
      const updateData = {
        firstName: 'Johnny',
        lastName: 'Updated'
      };

      const updatedUser = await userService.updateUser(testUser._id, updateData);

      expect(updatedUser).toBeTruthy();
      expect(updatedUser.firstName).toBe(updateData.firstName);
      expect(updatedUser.lastName).toBe(updateData.lastName);
      expect(updatedUser.email).toBe(testUser.email); // Should remain unchanged
    });

    it('should not update with invalid data', async () => {
      const updateData = {
        email: 'invalid-email'
      };

      await expect(userService.updateUser(testUser._id, updateData)).rejects.toThrow();
    });

    it('should throw error for non-existent user', async () => {
      const invalidId = new mongoose.Types.ObjectId();
      const updateData = {
        firstName: 'Updated'
      };

      await expect(userService.updateUser(invalidId, updateData)).rejects.toThrow('User not found');
    });

    it('should not update password through regular update', async () => {
      const updateData = {
        firstName: 'Johnny',
        password: 'newpassword' // This should be ignored
      };

      const updatedUser = await userService.updateUser(testUser._id, updateData);

      expect(updatedUser.firstName).toBe(updateData.firstName);
      
      // Verify password wasn't changed
      const userWithPassword = await User.findById(testUser._id).select('+password');
      const isMatch = await userWithPassword.matchPassword('password123'); // Original password
      expect(isMatch).toBe(true);
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      const deletedUser = await userService.deleteUser(testUser._id);

      expect(deletedUser).toBeTruthy();
      expect(deletedUser._id.toString()).toBe(testUser._id.toString());

      // Verify user is actually deleted
      const user = await User.findById(testUser._id);
      expect(user).toBeNull();
    });

    it('should throw error for non-existent user', async () => {
      const invalidId = new mongoose.Types.ObjectId();

      await expect(userService.deleteUser(invalidId)).rejects.toThrow('User not found');
    });
  });

  describe('loginUser', () => {
    it('should login with valid credentials', async () => {
      const { user, token } = await userService.loginUser(testUser.email, 'password123');

      expect(user).toBeTruthy();
      expect(user.email).toBe(testUser.email);
      expect(user.password).toBeUndefined(); // Password should not be returned
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
    });

    it('should not login with invalid password', async () => {
      await expect(userService.loginUser(testUser.email, 'wrongpassword'))
        .rejects.toThrow('Invalid credentials');
    });

    it('should not login with non-existent email', async () => {
      await expect(userService.loginUser('nonexistent@example.com', 'password123'))
        .rejects.toThrow('Invalid credentials');
    });

    it('should not login inactive user', async () => {
      // Deactivate user
      await User.findByIdAndUpdate(testUser._id, { isActive: false });

      await expect(userService.loginUser(testUser.email, 'password123'))
        .rejects.toThrow('Account is deactivated');
    });

    it('should update lastLogin on successful login', async () => {
      const loginTime = new Date();
      await userService.loginUser(testUser.email, 'password123');

      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.lastLogin).toBeTruthy();
      expect(updatedUser.lastLogin.getTime()).toBeGreaterThanOrEqual(loginTime.getTime());
    });
  });

  describe('getUsers', () => {
    beforeEach(async () => {
      // Create additional test users
      await User.create([
        {
          firstName: 'Alice',
          lastName: 'Johnson',
          email: 'alice@example.com',
          password: 'password123',
          role: 'admin'
        },
        {
          firstName: 'Bob',
          lastName: 'Wilson',
          email: 'bob@example.com',
          password: 'password123',
          role: 'moderator'
        }
      ]);
    });

    it('should get all users with pagination', async () => {
      const result = await userService.getUsers({}, { page: 1, limit: 10 });

      expect(result.users).toBeTruthy();
      expect(Array.isArray(result.users)).toBe(true);
      expect(result.users.length).toBe(3); // testUser + 2 additional users
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.total).toBe(3);
      expect(result.pages).toBe(1);
    });

    it('should filter users by role', async () => {
      const result = await userService.getUsers({ role: 'admin' }, { page: 1, limit: 10 });

      expect(result.users.length).toBe(1);
      expect(result.users[0].role).toBe('admin');
    });

    it('should filter users by search term', async () => {
      const result = await userService.getUsers(
        { $or: [{ firstName: { $regex: 'alice', $options: 'i' } }] },
        { page: 1, limit: 10 }
      );

      expect(result.users.length).toBe(1);
      expect(result.users[0].firstName.toLowerCase()).toContain('alice');
    });

    it('should paginate results correctly', async () => {
      const result = await userService.getUsers({}, { page: 1, limit: 2 });

      expect(result.users.length).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(2);
      expect(result.total).toBe(3);
      expect(result.pages).toBe(2);
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const newPassword = 'newpassword123';
      
      await userService.changePassword(testUser._id, 'password123', newPassword);

      // Verify password was changed
      const updatedUser = await User.findById(testUser._id).select('+password');
      const isNewPasswordMatch = await updatedUser.matchPassword(newPassword);
      const isOldPasswordMatch = await updatedUser.matchPassword('password123');

      expect(isNewPasswordMatch).toBe(true);
      expect(isOldPasswordMatch).toBe(false);
    });

    it('should not change password with incorrect current password', async () => {
      await expect(
        userService.changePassword(testUser._id, 'wrongpassword', 'newpassword123')
      ).rejects.toThrow('Current password is incorrect');
    });

    it('should throw error for non-existent user', async () => {
      const invalidId = new mongoose.Types.ObjectId();

      await expect(
        userService.changePassword(invalidId, 'password123', 'newpassword123')
      ).rejects.toThrow('User not found');
    });
  });
});