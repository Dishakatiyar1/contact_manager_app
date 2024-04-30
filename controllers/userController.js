const asyncHandler = require("express-async-handler");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

// @desc register new user
// @route GET /api/users/register
// @access public

const registerUser = asyncHandler(async (req, res) => {
  const {userName, email, password} = req.body;
  if (!userName || !email || !password) {
    return res.status(400).json({error: "All fields are mandatory."});
  }

  try {
    const userAvailable = await User.findOne({email});
    if (userAvailable) {
      return res.status(400).json({error: "User already exists."});
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log("hashed password", hashedPassword);

    const user = new User({
      userName,
      email,
      password: hashedPassword,
    });

    await user.save();

    console.log("User created successfully", user);
    return res.status(201).json({_id: user.id, email: user.email});
  } catch (error) {
    console.error("Error creating user:", error);
    return res.status(500).json({error: "Internal server error."});
  }
});

// @desc login user
// @route GET /api/users/login
// @access public

const loginUser = asyncHandler(async (req, res) => {
  const {email, password} = req.body;
  if (!email || !password) {
    res.status(400);
    throw new Error("All field are mandatory!");
  }
  const user = await User.findOne({email});
  // compare password with hashed password
  if (user && (await bcrypt.compare(password, user.password))) {
    const accessToken = jwt.sign(
      {
        user: {
          userName: user.userName,
          email: user.email,
          password: user.password,
        },
      },
      process.env.ACCESS_TOKEN_SECRET,
      {expiresIn: "15m"}
    );
    res.status(200).json({accessToken});
  } else {
    res.status(401);
    throw new Error("Email or password is not valid.");
  }
});

// @desc get current user
// @route GET /api/users/current
// @access public

const currentUser = asyncHandler(async (req, res) => {
  res.json(req.user);
});

module.exports = {registerUser, loginUser, currentUser};
