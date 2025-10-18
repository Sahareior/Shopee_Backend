import bcrypt from 'bcrypt';
import User from '../model/User.js';

// 🧩 SIGN UP
export const signUp = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json('User already exists');
    }

    // Hash the password before saving
    const hashedPassword  = await bcrypt.hash(password, 10);

    // Create and save new user
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
    });

    await newUser.save();

    res.status(201).json({
      message: 'User registered successfully',
      user: { id: newUser._id, name: newUser.name, email: newUser.email },
    });
  } catch (err) {
    console.error('Sign-up error:', err);
    res.status(500).json('Something went wrong while signing up');
  }
};

// 🧩 SIGN IN
export const signIn = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json('User not found! Please sign up first.');
    }

    // Compare entered password with stored hash
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json('Invalid password! Please try again.');
    }

    // Success response
    res.status(200).json({
      message: 'Logged in successfully',
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error('Sign-in error:', err);
    res.status(500).json('Something went wrong while logging in');
  }
};

// ✅ Simple test route (optional)
export const getUser = async (req, res) => {
  try {
    res.status(200).json('Server and user routes are working fine');
  } catch (err) {
    res.status(500).json('Something went wrong');
  }
};
