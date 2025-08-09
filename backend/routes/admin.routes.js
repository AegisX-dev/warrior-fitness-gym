const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/user.models');
const Member = require('../models/member.models');
const middleware = require('../middlewares/auth.middleware');

const router = express.Router();

// Admin login route
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

        // Find admin user by email
        const admin = await User.findOne({ email });
        if (!admin) {
            return res.status(400).json({ message: 'Invalid admin credentials' });
        }

        // Check password
        const isPasswordValid = await bcrypt.compare(password, admin.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: 'Invalid admin credentials' });
        }

        // Generate JWT token with admin type
        const token = jwt.sign(
            { 
                userId: admin._id,
                type: 'admin'
            },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '8h' }
        );

        res.json({
            message: 'Admin login successful',
            token,
            admin: {
                id: admin._id,
                name: admin.name,
                email: admin.email
            }
        });
    } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get dashboard statistics (protected admin route)
router.get('/dashboard/stats', middleware, async (req, res) => {
    try {
        if (req.user.type !== 'admin') {
            return res.status(403).json({ message: 'Admin access required' });
        }

        const totalMembers = await Member.countDocuments();
        const activeMembers = await Member.countDocuments({ membershipStatus: 'active' });
        const inactiveMembers = await Member.countDocuments({ membershipStatus: 'inactive' });
        const suspendedMembers = await Member.countDocuments({ membershipStatus: 'suspended' });

        const membershipTypes = await Member.aggregate([
            { $group: { _id: '$membershipType', count: { $sum: 1 } } }
        ]);

        const expiredMemberships = await Member.countDocuments({
            membershipExpiry: { $lt: new Date() }
        });

        const expiringSoon = await Member.countDocuments({
            membershipExpiry: { 
                $gte: new Date(),
                $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
            }
        });

        res.json({
            totalMembers,
            activeMembers,
            inactiveMembers,
            suspendedMembers,
            membershipTypes,
            expiredMemberships,
            expiringMemberships: expiringSoon
        });
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Search members (protected admin route) - MOVED BEFORE GET /members/:id
router.get('/members/search', middleware, async (req, res) => {
    try {
        if (req.user.type !== 'admin') {
            return res.status(403).json({ message: 'Admin access required' });
        }

        const { query, membershipType, membershipStatus } = req.query;
        const searchCriteria = {};

        if (query) {
            searchCriteria.$or = [
                { name: { $regex: query, $options: 'i' } },
                { email: { $regex: query, $options: 'i' } }
            ];
        }

        if (membershipType) {
            searchCriteria.membershipType = membershipType;
        }

        if (membershipStatus) {
            searchCriteria.membershipStatus = membershipStatus;
        }

        const members = await Member.find(searchCriteria)
            .select('-password -resetPasswordToken -resetPasswordExpires')
            .sort({ createdAt: -1 })
            .limit(50);

        res.json({ members });
    } catch (error) {
        console.error('Search members error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get members with expiring memberships (protected admin route) - MOVED BEFORE GET /members/:id
router.get('/members/expiring', middleware, async (req, res) => {
    try {
        if (req.user.type !== 'admin') {
            return res.status(403).json({ message: 'Admin access required' });
        }

        const days = parseInt(req.query.days) || 30; // Default to 30 days
        const expiringDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

        const expiringMembers = await Member.find({
            membershipExpiry: { 
                $gte: new Date(),
                $lte: expiringDate
            },
            membershipStatus: 'active'
        }).select('-password -resetPasswordToken -resetPasswordExpires')
          .sort({ membershipExpiry: 1 });

        res.json({ expiringMembers });
    } catch (error) {
        console.error('Get expiring members error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all members (protected admin route)
router.get('/members', middleware, async (req, res) => {
    try {
        if (req.user.type !== 'admin') {
            return res.status(403).json({ message: 'Admin access required' });
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const members = await Member.find()
            .select('-password -resetPasswordToken -resetPasswordExpires')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const totalMembers = await Member.countDocuments();

        res.json({
            members,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalMembers / limit),
                totalMembers,
                hasNext: page < Math.ceil(totalMembers / limit),
                hasPrev: page > 1
            }
        });
    } catch (error) {
        console.error('Get members error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create new member (protected admin route)
router.post('/members', middleware, [
    body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('membershipType').optional().isIn(['basic', 'premium', 'vip']).withMessage('Invalid membership type'),
    body('membershipStatus').optional().isIn(['active', 'inactive', 'suspended']).withMessage('Invalid membership status')
], async (req, res) => {
    try {
        if (req.user.type !== 'admin') {
            return res.status(403).json({ message: 'Admin access required' });
        }

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, email, password, membershipType = 'basic', membershipStatus = 'active' } = req.body;

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
            membershipStatus,
            membershipExpiry
        });

        await member.save();

        res.status(201).json({
            message: 'Member created successfully',
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
        console.error('Create member error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get member by ID (protected admin route) - MOVED AFTER specific routes
router.get('/members/:id', middleware, async (req, res) => {
    try {
        if (req.user.type !== 'admin') {
            return res.status(403).json({ message: 'Admin access required' });
        }

        const member = await Member.findById(req.params.id)
            .select('-password -resetPasswordToken -resetPasswordExpires');

        if (!member) {
            return res.status(404).json({ message: 'Member not found' });
        }

        res.json({ member });
    } catch (error) {
        console.error('Get member error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update member (protected admin route)
router.put('/members/:id', middleware, [
    body('name').optional().trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
    body('email').optional().isEmail().withMessage('Please provide a valid email'),
    body('membershipType').optional().isIn(['basic', 'premium', 'vip']).withMessage('Invalid membership type'),
    body('membershipStatus').optional().isIn(['active', 'inactive', 'suspended']).withMessage('Invalid membership status')
], async (req, res) => {
    try {
        if (req.user.type !== 'admin') {
            return res.status(403).json({ message: 'Admin access required' });
        }

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, email, membershipType, membershipStatus, membershipExpiry } = req.body;
        const updateData = {};

        if (name) updateData.name = name;
        if (email) updateData.email = email;
        if (membershipType) updateData.membershipType = membershipType;
        if (membershipStatus) updateData.membershipStatus = membershipStatus;
        if (membershipExpiry) updateData.membershipExpiry = new Date(membershipExpiry);

        const member = await Member.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        ).select('-password -resetPasswordToken -resetPasswordExpires');

        if (!member) {
            return res.status(404).json({ message: 'Member not found' });
        }

        res.json({
            message: 'Member updated successfully',
            member
        });
    } catch (error) {
        console.error('Update member error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Extend membership (protected admin route)
router.put('/members/:id/extend', middleware, [
    body('months').isInt({ min: 1, max: 60 }).withMessage('Months must be between 1 and 60')
], async (req, res) => {
    try {
        if (req.user.type !== 'admin') {
            return res.status(403).json({ message: 'Admin access required' });
        }

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { months } = req.body;
        const member = await Member.findById(req.params.id);

        if (!member) {
            return res.status(404).json({ message: 'Member not found' });
        }

        // Extend membership from current expiry date or now (whichever is later)
        const currentExpiry = member.membershipExpiry;
        const now = new Date();
        const baseDate = currentExpiry > now ? currentExpiry : now;

        const newExpiry = new Date(baseDate);
        newExpiry.setMonth(newExpiry.getMonth() + months);

        member.membershipExpiry = newExpiry;
        if (member.membershipStatus === 'inactive') {
            member.membershipStatus = 'active';
        }

        await member.save();

        res.json({
            message: `Membership extended by ${months} months`,
            member: {
                id: member._id,
                name: member.name,
                email: member.email,
                membershipType: member.membershipType,
                membershipStatus: member.membershipStatus,
                membershipExpiry: member.membershipExpiry
            }
        });
    } catch (error) {
        console.error('Extend membership error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete member (protected admin route)
router.delete('/members/:id', middleware, async (req, res) => {
    try {
        if (req.user.type !== 'admin') {
            return res.status(403).json({ message: 'Admin access required' });
        }

        const member = await Member.findByIdAndDelete(req.params.id);

        if (!member) {
            return res.status(404).json({ message: 'Member not found' });
        }

        res.json({ message: 'Member deleted successfully' });
    } catch (error) {
        console.error('Delete member error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;