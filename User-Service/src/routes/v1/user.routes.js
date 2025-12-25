const express = require('express');
const { UserController } = require('../../controllers');
const authenticate = require('../../middleware/auth.middleware');

const userRouter = express.Router();
const userController = new UserController();

// Public routes
userRouter.post('/register', (req, res, next) => userController.register(req, res, next));
userRouter.post('/login', (req, res, next) => userController.login(req, res, next));
userRouter.post('/refresh', (req, res, next) => userController.refresh(req, res, next));

// Protected routes
userRouter.get('/profile', authenticate, (req, res, next) => userController.getProfile(req, res, next));
userRouter.put('/profile', authenticate, (req, res, next) => userController.updateProfile(req, res, next));
userRouter.put('/password', authenticate, (req, res, next) => userController.changePassword(req, res, next));

module.exports = userRouter;
