const bcrypt = require('bcrypt');
const prisma = require('../config/prisma');
const generateToken = require('../utils/jwt');

exports.signup = async (req, res) => {
  try {
    const { organizationName, email, password } = req.body;

    if (!organizationName || !email || !password) {
      return res.status(400).json({
        message: 'organizationName, email and password are required'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: 'Password must be at least 6 characters'
      });
    }

    const existingUser =
      await prisma.user.findUnique({
        where: {
          email: email.toLowerCase().trim()
        }
      });

    if (existingUser) {
      return res.status(400).json({
        message: 'Email already exists'
      });
    }

    const organization =
      await prisma.organization.create({
        data: {
          name: organizationName
        }
      });

    const hashedPassword =
      await bcrypt.hash(password, 10);

    const user =
      await prisma.user.create({
        data: {
          email: email.toLowerCase().trim(),
          password: hashedPassword,
          organizationId: organization.id
        }
      });

    await prisma.setting.create({
      data: {
        organizationId: organization.id
      }
    });

    const token = generateToken(user);

    res.status(201).json({ token });

  } catch (error) {
    res.status(500).json({ message: 'Failed to signup' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: 'email and password are required'
      });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user);
    return res.json({ token });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to login' });
  }
};

exports.me = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: {
        organization: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json({
      id: user.id,
      email: user.email,
      organization: user.organization
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch user profile' });
  }
};