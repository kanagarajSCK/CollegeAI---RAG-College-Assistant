import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../models/db';
import { generateToken, AuthRequest } from '../middleware/auth';

export class AuthController {
  public async register(req: Request, res: Response): Promise<void> {
    try {
      const { name, email, password, confirmPassword } = req.body;

      if (!name || !email || !password) {
        res.status(400).json({ error: 'Name, email, and password are required.' });
        return;
      }

      if (confirmPassword && password !== confirmPassword) {
        res.status(400).json({ error: 'Passwords do not match.' });
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        res.status(400).json({ error: 'Please provide a valid email address.' });
        return;
      }

      if (password.length < 6) {
        res.status(400).json({ error: 'Password must be at least 6 characters long.' });
        return;
      }

      const existingUser = db.findUserByEmail(email);
      if (existingUser) {
        res.status(409).json({ error: 'An account with this email address already exists.' });
        return;
      }

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      const newUser = db.createUser({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        passwordHash,
      });

      const token = generateToken({
        id: newUser._id,
        email: newUser.email,
        name: newUser.name,
      });

      res.status(201).json({
        message: 'Account registered successfully.',
        token,
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          createdAt: newUser.createdAt,
        },
      });
    } catch (err: any) {
      console.error('Registration error:', err);
      res.status(500).json({ error: 'Failed to complete registration. Please try again.' });
    }
  }

  public async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ error: 'Email and password are required.' });
        return;
      }

      const user = db.findUserByEmail(email);
      if (!user) {
        res.status(401).json({ error: 'Invalid email or password.' });
        return;
      }

      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        res.status(401).json({ error: 'Invalid email or password.' });
        return;
      }

      const token = generateToken({
        id: user._id,
        email: user.email,
        name: user.name,
      });

      res.json({
        message: 'Login successful.',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt,
        },
      });
    } catch (err: any) {
      console.error('Login error:', err);
      res.status(500).json({ error: 'Failed to process login. Please try again.' });
    }
  }

  public async me(req: AuthRequest, res: Response): Promise<void> {
    try {
      const user = db.findUserById(req.user!.id);
      if (!user) {
        res.status(404).json({ error: 'User not found.' });
        return;
      }

      const stats = db.getUserStats(user._id);

      res.json({
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          stats,
        },
      });
    } catch (err: any) {
      console.error('Me endpoint error:', err);
      res.status(500).json({ error: 'Failed to fetch user profile.' });
    }
  }

  public async updateProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { name } = req.body;
      if (!name || name.trim().length === 0) {
        res.status(400).json({ error: 'Name cannot be empty.' });
        return;
      }

      const updated = db.updateUser(req.user!.id, { name: name.trim() });
      if (!updated) {
        res.status(404).json({ error: 'User not found.' });
        return;
      }

      res.json({
        message: 'Profile updated successfully.',
        user: {
          id: updated._id,
          name: updated.name,
          email: updated.email,
          createdAt: updated.createdAt,
          updatedAt: updated.updatedAt,
        },
      });
    } catch (err: any) {
      console.error('Update profile error:', err);
      res.status(500).json({ error: 'Failed to update profile.' });
    }
  }

  public async changePassword(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        res.status(400).json({ error: 'Current password and new password are required.' });
        return;
      }

      if (newPassword.length < 6) {
        res.status(400).json({ error: 'New password must be at least 6 characters long.' });
        return;
      }

      const user = db.findUserById(req.user!.id);
      if (!user) {
        res.status(404).json({ error: 'User not found.' });
        return;
      }

      const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isMatch) {
        res.status(400).json({ error: 'Current password is incorrect.' });
        return;
      }

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(newPassword, salt);

      db.updateUser(user._id, { passwordHash });

      res.json({ message: 'Password updated successfully.' });
    } catch (err: any) {
      console.error('Change password error:', err);
      res.status(500).json({ error: 'Failed to change password.' });
    }
  }

  public async deleteAccount(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const success = db.deleteUser(userId);
      if (!success) {
        res.status(404).json({ error: 'User not found.' });
        return;
      }

      res.json({ message: 'Account and all associated documents deleted successfully.' });
    } catch (err: any) {
      console.error('Delete account error:', err);
      res.status(500).json({ error: 'Failed to delete account.' });
    }
  }

  public logout(_req: Request, res: Response): void {
    res.json({ message: 'Logged out successfully.' });
  }
}

export const authController = new AuthController();
