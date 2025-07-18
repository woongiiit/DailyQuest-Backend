const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // 토큰 추출
      token = req.headers.authorization.split(' ')[1];

      // 토큰 검증
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 사용자 정보 가져오기
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return res.status(401).json({ message: '유효하지 않은 토큰입니다.' });
      }

      req.user = user;
      next();
    } catch (error) {
      console.error('토큰 검증 실패:', error);
      return res.status(401).json({ message: '유효하지 않은 토큰입니다.' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: '토큰이 제공되지 않았습니다.' });
  }
};

// JWT 토큰 생성
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

module.exports = { protect, generateToken }; 