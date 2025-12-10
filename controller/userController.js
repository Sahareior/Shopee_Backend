import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import User from '../model/User.js';

dotenv.config();

// helper to create token
const createToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '1h' });

// 🧩 SIGN UP
export const signUp = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json('User already exists');

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();

    // Option: send token on signup so user is logged in immediately
    const token = createToken({ id: newUser._id, email: newUser.email });

    res.status(201).json({
      message: 'User registered successfully',
      user: { id: newUser._id, name: newUser.name, email: newUser.email,firstLogin: newUser.firstLogin },
      token, // client can store it (or you can set httpOnly cookie instead)
    });
  } catch (err) {
    console.error('Sign-up error:', err);
    res.status(500).json('Something went wrong while signing up');
  }
};

// 🧩 SIGN IN (ISSUE JWT)
export const signIn = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(req.body);

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json('User not found! Please sign up first.');

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json('Invalid password! Please try again.');

    const token = createToken({ id: user._id, email: user.email });

    // Return token + user info (client stores token or you can use httpOnly cookie)
    res.status(200).json({
      message: 'Logged in successfully',
      user: { id: user._id, name: user.name, email: user.email, firstLogin: user.firstLogin },
      token,
    });
  } catch (err) {
    console.error('Sign-in error:', err);
    res.status(500).json('Something went wrong while logging in');
  }
};
export const getUser = async (req, res) => {
  try {
    // Fetch all users but EXCLUDE passwords
    const users = await User.find({}, { password: 0 });

    res.status(200).json({
      message: 'All users retrieved successfully',
      users,
    });
  } catch (err) {
    console.error('Get users error:', err);
    res.status(500).json('Something went wrong while fetching users');
  }
};



export const updateFirstLogin = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findByIdAndUpdate(
      userId,
      { firstLogin: false },
      { new: true },
      { password: 0 }
    );

    console.log(user,'adsada');
    if (!user) return res.status(404).json('User not found');

    res.status(200).json({
      message: 'First login status updated successfully',
      user,
    });
  } catch (err) {
    console.error('Update first login error:', err);
    res.status(500).json('Something went wrong while updating first login status');
  }
};