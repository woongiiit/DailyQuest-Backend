const express = require('express');
const User = require('../models/User');
const { protect, generateToken } = require('../middleware/auth');

const router = express.Router();

// @desc    회원가입
// @route   POST /api/auth/register
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { username, password, nickname } = req.body;

    // 필수 필드 검증
    if (!username || !password || !nickname) {
      return res.status(400).json({ 
        success: false, 
        message: '모든 필드를 입력해주세요.' 
      });
    }

    // 사용자명 중복 확인
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: '이미 존재하는 아이디입니다.' 
      });
    }

    // 고유 코드 생성 (중복되지 않을 때까지)
    let uniqueCode;
    let isUnique = false;
    while (!isUnique) {
      uniqueCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const existingCode = await User.findOne({ uniqueCode });
      if (!existingCode) {
        isUnique = true;
      }
    }

    // 새 사용자 생성
    const user = await User.create({
      username,
      password,
      nickname,
      uniqueCode
    });

    // JWT 토큰 생성
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: '회원가입이 완료되었습니다.',
      data: {
        user: {
          id: user._id,
          username: user.username,
          nickname: user.nickname,
          uniqueCode: user.uniqueCode
        },
        token
      }
    });
  } catch (error) {
    console.error('회원가입 에러:', error);
    res.status(500).json({ 
      success: false, 
      message: '회원가입 중 오류가 발생했습니다.' 
    });
  }
});

// @desc    로그인
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // 필수 필드 검증
    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: '아이디와 비밀번호를 입력해주세요.' 
      });
    }

    // 사용자 찾기
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: '아이디 또는 비밀번호가 올바르지 않습니다.' 
      });
    }

    // 비밀번호 확인
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: '아이디 또는 비밀번호가 올바르지 않습니다.' 
      });
    }

    // 마지막 로그인 시간 업데이트
    user.lastLoginAt = new Date();
    await user.save();

    // JWT 토큰 생성
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: '로그인이 완료되었습니다.',
      data: {
        user: {
          id: user._id,
          username: user.username,
          nickname: user.nickname,
          uniqueCode: user.uniqueCode,
          linkedUserId: user.linkedUserId
        },
        token
      }
    });
  } catch (error) {
    console.error('로그인 에러:', error);
    res.status(500).json({ 
      success: false, 
      message: '로그인 중 오류가 발생했습니다.' 
    });
  }
});

// @desc    현재 사용자 정보 조회
// @route   GET /api/auth/me
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('linkedUserId', 'nickname uniqueCode profileImage');

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          username: user.username,
          nickname: user.nickname,
          uniqueCode: user.uniqueCode,
          linkedUserId: user.linkedUserId,
          profileImage: user.profileImage,
          createdAt: user.createdAt,
          lastLoginAt: user.lastLoginAt
        }
      }
    });
  } catch (error) {
    console.error('사용자 정보 조회 에러:', error);
    res.status(500).json({ 
      success: false, 
      message: '사용자 정보 조회 중 오류가 발생했습니다.' 
    });
  }
});

// @desc    고유 코드로 사용자 검색
// @route   GET /api/auth/search/:uniqueCode
// @access  Private
router.get('/search/:uniqueCode', protect, async (req, res) => {
  try {
    const { uniqueCode } = req.params;

    // 본인 코드는 검색 불가
    if (uniqueCode === req.user.uniqueCode) {
      return res.status(400).json({ 
        success: false, 
        message: '자신의 고유 코드는 검색할 수 없습니다.' 
      });
    }

    const user = await User.findOne({ uniqueCode })
      .select('nickname uniqueCode profileImage createdAt');

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: '해당 고유 코드를 가진 사용자를 찾을 수 없습니다.' 
      });
    }

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('사용자 검색 에러:', error);
    res.status(500).json({ 
      success: false, 
      message: '사용자 검색 중 오류가 발생했습니다.' 
    });
  }
});

module.exports = router; 