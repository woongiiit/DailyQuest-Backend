const express = require('express');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @desc    사용자 연동
// @route   POST /api/users/link
// @access  Private
router.post('/link', protect, async (req, res) => {
  try {
    const { uniqueCode } = req.body;

    if (!uniqueCode) {
      return res.status(400).json({ 
        success: false, 
        message: '고유 코드를 입력해주세요.' 
      });
    }

    // 본인 코드는 연동 불가
    if (uniqueCode === req.user.uniqueCode) {
      return res.status(400).json({ 
        success: false, 
        message: '자신의 고유 코드로는 연동할 수 없습니다.' 
      });
    }

    // 대상 사용자 찾기
    const targetUser = await User.findOne({ uniqueCode });
    if (!targetUser) {
      return res.status(404).json({ 
        success: false, 
        message: '해당 고유 코드를 가진 사용자를 찾을 수 없습니다.' 
      });
    }

    // 이미 연동된 사용자가 있는지 확인
    if (req.user.linkedUserId) {
      return res.status(400).json({ 
        success: false, 
        message: '이미 연동된 사용자가 있습니다. 먼저 연동을 해제해주세요.' 
      });
    }

    if (targetUser.linkedUserId) {
      return res.status(400).json({ 
        success: false, 
        message: '해당 사용자는 이미 다른 사용자와 연동되어 있습니다.' 
      });
    }

    // 양방향 연동 설정
    req.user.linkedUserId = targetUser._id;
    targetUser.linkedUserId = req.user._id;

    await req.user.save();
    await targetUser.save();

    res.json({
      success: true,
      message: '사용자 연동이 완료되었습니다.',
      data: {
        linkedUser: {
          id: targetUser._id,
          nickname: targetUser.nickname,
          uniqueCode: targetUser.uniqueCode,
          profileImage: targetUser.profileImage
        }
      }
    });
  } catch (error) {
    console.error('사용자 연동 에러:', error);
    res.status(500).json({ 
      success: false, 
      message: '사용자 연동 중 오류가 발생했습니다.' 
    });
  }
});

// @desc    사용자 연동 해제
// @route   DELETE /api/users/unlink
// @access  Private
router.delete('/unlink', protect, async (req, res) => {
  try {
    if (!req.user.linkedUserId) {
      return res.status(400).json({ 
        success: false, 
        message: '연동된 사용자가 없습니다.' 
      });
    }

    // 연동된 사용자 찾기
    const linkedUser = await User.findById(req.user.linkedUserId);
    if (linkedUser) {
      // 양방향 연동 해제
      linkedUser.linkedUserId = null;
      await linkedUser.save();
    }

    // 현재 사용자 연동 해제
    req.user.linkedUserId = null;
    await req.user.save();

    res.json({
      success: true,
      message: '사용자 연동이 해제되었습니다.'
    });
  } catch (error) {
    console.error('사용자 연동 해제 에러:', error);
    res.status(500).json({ 
      success: false, 
      message: '사용자 연동 해제 중 오류가 발생했습니다.' 
    });
  }
});

// @desc    연동된 사용자 정보 조회
// @route   GET /api/users/linked
// @access  Private
router.get('/linked', protect, async (req, res) => {
  try {
    if (!req.user.linkedUserId) {
      return res.status(404).json({ 
        success: false, 
        message: '연동된 사용자가 없습니다.' 
      });
    }

    const linkedUser = await User.findById(req.user.linkedUserId)
      .select('nickname uniqueCode profileImage createdAt');

    if (!linkedUser) {
      // 연동된 사용자가 삭제된 경우
      req.user.linkedUserId = null;
      await req.user.save();
      
      return res.status(404).json({ 
        success: false, 
        message: '연동된 사용자를 찾을 수 없습니다.' 
      });
    }

    res.json({
      success: true,
      data: { linkedUser }
    });
  } catch (error) {
    console.error('연동 사용자 조회 에러:', error);
    res.status(500).json({ 
      success: false, 
      message: '연동 사용자 조회 중 오류가 발생했습니다.' 
    });
  }
});

// @desc    프로필 이미지 업데이트
// @route   PUT /api/users/profile-image
// @access  Private
router.put('/profile-image', protect, async (req, res) => {
  try {
    const { profileImage } = req.body;

    if (!profileImage) {
      return res.status(400).json({ 
        success: false, 
        message: '프로필 이미지를 입력해주세요.' 
      });
    }

    req.user.profileImage = profileImage;
    await req.user.save();

    res.json({
      success: true,
      message: '프로필 이미지가 업데이트되었습니다.',
      data: { profileImage: req.user.profileImage }
    });
  } catch (error) {
    console.error('프로필 이미지 업데이트 에러:', error);
    res.status(500).json({ 
      success: false, 
      message: '프로필 이미지 업데이트 중 오류가 발생했습니다.' 
    });
  }
});

// @desc    닉네임 업데이트
// @route   PUT /api/users/nickname
// @access  Private
router.put('/nickname', protect, async (req, res) => {
  try {
    const { nickname } = req.body;

    if (!nickname || nickname.length < 2 || nickname.length > 10) {
      return res.status(400).json({ 
        success: false, 
        message: '닉네임은 2-10자 사이여야 합니다.' 
      });
    }

    req.user.nickname = nickname;
    await req.user.save();

    res.json({
      success: true,
      message: '닉네임이 업데이트되었습니다.',
      data: { nickname: req.user.nickname }
    });
  } catch (error) {
    console.error('닉네임 업데이트 에러:', error);
    res.status(500).json({ 
      success: false, 
      message: '닉네임 업데이트 중 오류가 발생했습니다.' 
    });
  }
});

module.exports = router; 