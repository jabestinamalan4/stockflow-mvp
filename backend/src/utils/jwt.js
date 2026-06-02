const jwt = require('jsonwebtoken');

const generateToken = (user) => {
  return jwt.sign(
    {
      userId: user.id,
      organizationId: user.organizationId
    },
    process.env.JWT_SECRET,
    {
      expiresIn: '7d'
    }
  );
};

module.exports = generateToken;