const { UserRepository } = require('../repositories');
const { comparePassword, validatePasswordStrength, hashPassword } = require('../utils/password.utils');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt.utils');
const BadRequest = require('../errors/badrequest.error');
const Unauthorized = require('../errors/unauthorized.error');
const NotFound = require('../errors/notfound.error');
const logger = require('../config/logger.config');

class UserService {
    constructor() {
        this.userRepository = new UserRepository();
    }

    /**
     * Register a new user
     * @param {Object} userData - User registration data
     * @returns {Promise<Object>} - User object without password
     */
    async registerUser(userData) {
        try {
            // Validate password strength
            const passwordValidation = validatePasswordStrength(userData.password);
            if (!passwordValidation.isValid) {
                throw new BadRequest('password', passwordValidation.errors.join(', '));
            }

            // Check if email already exists
            const existingUserByEmail = await this.userRepository.getUserByEmail(userData.email);
            if (existingUserByEmail) {
                throw new BadRequest('email', 'Email already registered');
            }

            // Check if username already exists
            const existingUserByUsername = await this.userRepository.getUserByUsername(userData.username);
            if (existingUserByUsername) {
                throw new BadRequest('username', 'Username already taken');
            }

            // Create user
            const user = await this.userRepository.createUser(userData);

            logger.info(`New user registered: ${user.email}`);

            // Return user without password
            return user.toJSON();
        } catch (error) {
            logger.error('UserService.registerUser:', error);
            throw error;
        }
    }

    /**
     * Login user
     * @param {string} email - User email
     * @param {string} password - User password
     * @returns {Promise<Object>} - Access token, refresh token, and user data
     */
    async loginUser(email, password) {
        try {
            // Find user by email
            const user = await this.userRepository.getUserByEmail(email);
            if (!user) {
                throw new Unauthorized('Invalid email or password');
            }

            // Check if user is active
            if (!user.isActive) {
                throw new Unauthorized('Account is deactivated');
            }

            // Verify password
            const isPasswordValid = await comparePassword(password, user.password);
            if (!isPasswordValid) {
                throw new Unauthorized('Invalid email or password');
            }

            // Generate tokens
            const payload = {
                id: user._id,
                email: user.email,
                username: user.username,
                role: user.role
            };

            const accessToken = generateAccessToken(payload);
            const refreshToken = generateRefreshToken(payload);

            logger.info(`User logged in: ${user.email}`);

            return {
                accessToken,
                refreshToken,
                user: user.toJSON()
            };
        } catch (error) {
            logger.error('UserService.loginUser:', error);
            throw error;
        }
    }

    /**
     * Refresh access token
     * @param {string} refreshToken - Refresh token
     * @returns {Promise<Object>} - New access token
     */
    async refreshAccessToken(refreshToken) {
        try {
            // Verify refresh token
            const decoded = verifyRefreshToken(refreshToken);

            // Get user from database
            const user = await this.userRepository.getUserById(decoded.id);

            if (!user.isActive) {
                throw new Unauthorized('Account is deactivated');
            }

            // Generate new access token
            const payload = {
                id: user._id,
                email: user.email,
                username: user.username,
                role: user.role
            };

            const newAccessToken = generateAccessToken(payload);

            return {
                accessToken: newAccessToken
            };
        } catch (error) {
            logger.error('UserService.refreshAccessToken:', error);
            throw error;
        }
    }

    /**
     * Get user profile
     * @param {string} userId - User ID
     * @returns {Promise<Object>} - User profile
     */
    async getUserProfile(userId) {
        try {
            const user = await this.userRepository.getUserById(userId);
            return user.toJSON();
        } catch (error) {
            logger.error('UserService.getUserProfile:', error);
            throw error;
        }
    }

    /**
     * Update user profile
     * @param {string} userId - User ID
     * @param {Object} updateData - Data to update (firstName, lastName)
     * @returns {Promise<Object>} - Updated user profile
     */
    async updateUserProfile(userId, updateData) {
        try {
            // Only allow updating specific fields
            const allowedUpdates = ['firstName', 'lastName'];
            const updates = {};

            for (const key of allowedUpdates) {
                if (updateData[key] !== undefined) {
                    updates[key] = updateData[key];
                }
            }

            if (Object.keys(updates).length === 0) {
                throw new BadRequest('updateData', 'No valid fields to update');
            }

            const updatedUser = await this.userRepository.updateUser(userId, updates);

            logger.info(`User profile updated: ${updatedUser.email}`);

            return updatedUser.toJSON();
        } catch (error) {
            logger.error('UserService.updateUserProfile:', error);
            throw error;
        }
    }

    /**
     * Change user password
     * @param {string} userId - User ID
     * @param {string} oldPassword - Current password
     * @param {string} newPassword - New password
     * @returns {Promise<Object>} - Success message
     */
    async changePassword(userId, oldPassword, newPassword) {
        try {
            // Get user
            const user = await this.userRepository.getUserById(userId);

            // Verify old password
            const isPasswordValid = await comparePassword(oldPassword, user.password);
            if (!isPasswordValid) {
                throw new Unauthorized('Current password is incorrect');
            }

            // Validate new password strength
            const passwordValidation = validatePasswordStrength(newPassword);
            if (!passwordValidation.isValid) {
                throw new BadRequest('newPassword', passwordValidation.errors.join(', '));
            }

            // Hash new password
            const hashedPassword = await hashPassword(newPassword);

            // Update password
            user.password = hashedPassword;
            await user.save();

            logger.info(`Password changed for user: ${user.email}`);

            return {
                message: 'Password changed successfully'
            };
        } catch (error) {
            logger.error('UserService.changePassword:', error);
            throw error;
        }
    }
}

module.exports = UserService;
