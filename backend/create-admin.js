const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/warrior-fitness-gym');

// Admin User Schema (simplified)
const adminSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    type: { type: String, default: 'admin' }
});

const Admin = mongoose.model('User', adminSchema);

async function createAdminUser() {
    try {
        // Check if admin already exists
        const existingAdmin = await Admin.findOne({ email: 'admin@warriorfitness.com' });
        if (existingAdmin) {
            console.log('Admin user already exists');
            return;
        }

        // Hash password
        const hashedPassword = await bcrypt.hash('admin123456', 10);

        // Create admin user
        const admin = new Admin({
            name: 'Admin User',
            email: 'admin@warriorfitness.com',
            password: hashedPassword,
            type: 'admin'
        });

        await admin.save();
        console.log('Admin user created successfully');
        console.log('Email: admin@warriorfitness.com');
        console.log('Password: admin123456');
    } catch (error) {
        console.error('Error creating admin user:', error);
    } finally {
        mongoose.connection.close();
    }
}

createAdminUser();
