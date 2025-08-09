const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const Member = require('../models/member.models');
const middleware = require('../middlewares/auth.middleware');

const router = express.Router();

// Register route
router.post('/register', [
    body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('membershipType').optional().isIn(['basic', 'premium', 'vip']).withMessage('Invalid membership type')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, email, password, membershipType = 'basic' } = req.body;

        // Check if member already exists
        const existingMember = await Member.findOne({ email });
        if (existingMember) {
            return res.status(400).json({ message: 'Member already exists' });
        }

        // Hash password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Calculate membership expiry (1 year from now)
        const membershipExpiry = new Date();
        membershipExpiry.setFullYear(membershipExpiry.getFullYear() + 1);

        // Create new member
        const member = new Member({
            name,
            email,
            password: hashedPassword,
            membershipType,
            membershipExpiry
        });

        await member.save();

        // Generate JWT token
        const token = jwt.sign(
            { 
                memberId: member._id,
                type: 'member'
            },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '7d' }
        );

        res.status(201).json({
            message: 'Member registered successfully',
            token,
            member: {
                id: member._id,
                name: member.name,
                email: member.email,
                membershipType: member.membershipType,
                membershipStatus: member.membershipStatus,
                joinDate: member.joinDate,
                membershipExpiry: member.membershipExpiry
            }
        });
    } catch (error) {
        console.error('Member registration error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Login route
router.post('/login', [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').exists().withMessage('Password is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body;

        // Find member by email
        const member = await Member.findOne({ email });
        if (!member) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Check if membership is active
        if (member.membershipStatus !== 'active') {
            return res.status(403).json({ message: 'Membership is not active' });
        }

        // Check if membership has expired
        if (new Date() > member.membershipExpiry) {
            return res.status(403).json({ message: 'Membership has expired' });
        }

        // Check password
        const isPasswordValid = await bcrypt.compare(password, member.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { 
                memberId: member._id,
                type: 'member'
            },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '7d' }
        );

        res.json({
            message: 'Login successful',
            token,
            member: {
                id: member._id,
                name: member.name,
                email: member.email,
                membershipType: member.membershipType,
                membershipStatus: member.membershipStatus,
                joinDate: member.joinDate,
                membershipExpiry: member.membershipExpiry
            }
        });
    } catch (error) {
        console.error('Member login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Profile route (protected)
router.get('/profile', middleware, async (req, res) => {
    try {
        const member = await Member.findById(req.user.memberId).select('-password -resetPasswordToken -resetPasswordExpires');
        if (!member) {
            return res.status(404).json({ message: 'Member not found' });
        }

        res.json({
            member: {
                id: member._id,
                name: member.name,
                email: member.email,
                membershipType: member.membershipType,
                membershipStatus: member.membershipStatus,
                joinDate: member.joinDate,
                membershipExpiry: member.membershipExpiry,
                createdAt: member.createdAt,
                updatedAt: member.updatedAt
            }
        });
    } catch (error) {
        console.error('Member profile error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update profile route (protected)
router.put('/profile', middleware, [
    body('name').optional().trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name } = req.body;
        const updateData = {};

        if (name) updateData.name = name;

        const member = await Member.findByIdAndUpdate(
            req.user.memberId,
            updateData,
            { new: true, runValidators: true }
        ).select('-password -resetPasswordToken -resetPasswordExpires');

        if (!member) {
            return res.status(404).json({ message: 'Member not found' });
        }

        res.json({
            message: 'Profile updated successfully',
            member: {
                id: member._id,
                name: member.name,
                email: member.email,
                membershipType: member.membershipType,
                membershipStatus: member.membershipStatus,
                joinDate: member.joinDate,
                membershipExpiry: member.membershipExpiry,
                updatedAt: member.updatedAt
            }
        });
    } catch (error) {
        console.error('Member profile update error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Request password reset
router.post('/forgot-password', [
    body('email').isEmail().withMessage('Please provide a valid email')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email } = req.body;

        const member = await Member.findOne({ email });
        if (!member) {
            // Don't reveal if email exists or not for security
            return res.json({ message: 'If the email exists, a password reset link has been sent' });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

        member.resetPasswordToken = resetToken;
        member.resetPasswordExpires = resetTokenExpiry;
        await member.save();

        // In a real application, you would send an email here
        console.log(`Password reset token for ${email}: ${resetToken}`);

        res.json({ 
            message: 'If the email exists, a password reset link has been sent',
            // Remove this in production - only for testing
            resetToken: resetToken
        });
    } catch (error) {
        console.error('Password reset request error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Reset password
router.post('/reset-password/:token', [
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { token } = req.params;
        const { password } = req.body;

        const member = await Member.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!member) {
            return res.status(400).json({ message: 'Password reset token is invalid or has expired' });
        }

        // Hash new password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Update password and clear reset token
        member.password = hashedPassword;
        member.resetPasswordToken = undefined;
        member.resetPasswordExpires = undefined;
        await member.save();

        res.json({ message: 'Password has been reset successfully' });
    } catch (error) {
        console.error('Password reset error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Change password (protected)
router.post('/change-password', middleware, [
    body('currentPassword').exists().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { currentPassword, newPassword } = req.body;

        const member = await Member.findById(req.user.memberId);
        if (!member) {
            return res.status(404).json({ message: 'Member not found' });
        }

        // Verify current password
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, member.password);
        if (!isCurrentPasswordValid) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }

        // Hash new password
        const saltRounds = 10;
        const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

        // Update password
        member.password = hashedNewPassword;
        await member.save();

        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error('Password change error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Logout route
router.post('/logout', (req, res) => {
    // Since we're using JWT tokens, logout is handled on the client side
    // by removing the token from storage
    res.json({ message: 'Logout successful' });
});

module.exports = router;