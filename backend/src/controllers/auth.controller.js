import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const register = async (req, res) => {
  try {
    const { fullName, email, password, cnic, phone, role } = req.body;

    // Input validation
    if (!fullName || !email || !password || !cnic || !phone) {
      return res.status(400).json({ 
        message: "All fields are required", 
        required: ["fullName", "email", "password", "cnic", "phone"] 
      });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // Password strength validation
    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters long" });
    }

    // Role validation
    const validRoles = ["user", "admin", "accountant"];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({ 
        message: "Invalid role", 
        validRoles 
      });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: "User already exists" });
    }

    const hashed = await bcrypt.hash(password, 12); // Increased salt rounds

    const user = await User.create({
      fullName,
      email,
      password: hashed,
      cnic,
      phone,
      role: role || "user"
    });

    // Remove password from response
    const { password: _, ...userResponse } = user.toObject();

    res.status(201).json({ 
      message: "User registered successfully", 
      user: userResponse 
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ 
      message: "Internal server error",
      ...(process.env.NODE_ENV === 'development' && { error: err.message })
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Input validation
    if (!email || !password) {
      return res.status(400).json({ 
        message: "Email and password are required" 
      });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role }, 
      process.env.JWT_SECRET, 
      { expiresIn: "7d" }
    );

    // Remove password from response
    const { password: _, ...userResponse } = user.toObject();

    res.json({ 
      message: "Login successful",
      token, 
      user: userResponse 
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ 
      message: "Internal server error",
      ...(process.env.NODE_ENV === 'development' && { error: err.message })
    });
  }
};

export const getProfile = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const user = await User.findById(req.user._id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.status(200).json({ 
      message: "Profile retrieved successfully",
      user 
    });
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ 
      message: "Internal server error",
      ...(process.env.NODE_ENV === 'development' && { error: err.message })
    });
  }
};


