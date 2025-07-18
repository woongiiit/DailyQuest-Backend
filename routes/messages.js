const express = require('express');
const Message = require('../models/Message');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @desc    응원 메시지 전송
// @route   POST /api/messages/send
// @access  Private
router.post('/send', protect, async (req, res) => {
  try {
    const { toUserId, message, questDate } = req.body;

    if (!toUserId || !message || !questDate) {
      return res.status(400).json({ 
        success: false, 
        message: '모든 필드를 입력해주세요.' 
      });
    }

    // 연동된 사용자인지 확인
    if (req.user.linkedUserId.toString() !== toUserId) {
      return res.status(403).json({ 
        success: false, 
        message: '연동된 사용자에게만 메시지를 보낼 수 있습니다.' 
      });
    }

    // 메시지 생성
    const newMessage = await Message.create({
      fromUserId: req.user._id,
      toUserId: toUserId,
      message: message,
      questDate: questDate
    });

    // 발신자 정보 포함하여 응답
    const populatedMessage = await Message.findById(newMessage._id)
      .populate('fromUserId', 'nickname profileImage')
      .populate('toUserId', 'nickname profileImage');

    res.status(201).json({
      success: true,
      message: '응원 메시지가 전송되었습니다.',
      data: { message: populatedMessage }
    });
  } catch (error) {
    console.error('메시지 전송 에러:', error);
    res.status(500).json({ 
      success: false, 
      message: '메시지 전송 중 오류가 발생했습니다.' 
    });
  }
});

// @desc    특정 날짜의 메시지 조회
// @route   GET /api/messages/:questDate
// @access  Private
router.get('/:questDate', protect, async (req, res) => {
  try {
    const { questDate } = req.params;

    if (!req.user.linkedUserId) {
      return res.status(404).json({ 
        success: false, 
        message: '연동된 사용자가 없습니다.' 
      });
    }

    // 날짜 형식 검증
    if (!/^\d{4}-\d{2}-\d{2}$/.test(questDate)) {
      return res.status(400).json({ 
        success: false, 
        message: '날짜 형식이 올바르지 않습니다. (YYYY-MM-DD)' 
      });
    }

    const messages = await Message.find({
      questDate: questDate,
      $or: [
        { fromUserId: req.user._id, toUserId: req.user.linkedUserId },
        { fromUserId: req.user.linkedUserId, toUserId: req.user._id }
      ]
    })
    .populate('fromUserId', 'nickname profileImage')
    .populate('toUserId', 'nickname profileImage')
    .sort({ createdAt: 1 });

    res.json({
      success: true,
      data: { messages }
    });
  } catch (error) {
    console.error('메시지 조회 에러:', error);
    res.status(500).json({ 
      success: false, 
      message: '메시지 조회 중 오류가 발생했습니다.' 
    });
  }
});

// @desc    메시지 읽음 처리
// @route   PATCH /api/messages/:messageId/read
// @access  Private
router.patch('/:messageId/read', protect, async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ 
        success: false, 
        message: '메시지를 찾을 수 없습니다.' 
      });
    }

    // 본인이 받은 메시지인지 확인
    if (message.toUserId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: '읽음 처리할 권한이 없습니다.' 
      });
    }

    await message.markAsRead();

    res.json({
      success: true,
      message: '메시지가 읽음 처리되었습니다.',
      data: { message }
    });
  } catch (error) {
    console.error('메시지 읽음 처리 에러:', error);
    res.status(500).json({ 
      success: false, 
      message: '메시지 읽음 처리 중 오류가 발생했습니다.' 
    });
  }
});

// @desc    안 읽은 메시지 개수 조회
// @route   GET /api/messages/unread/count
// @access  Private
router.get('/unread/count', protect, async (req, res) => {
  try {
    if (!req.user.linkedUserId) {
      return res.json({
        success: true,
        data: { unreadCount: 0 }
      });
    }

    const unreadCount = await Message.countDocuments({
      toUserId: req.user._id,
      fromUserId: req.user.linkedUserId,
      isRead: false
    });

    res.json({
      success: true,
      data: { unreadCount }
    });
  } catch (error) {
    console.error('안 읽은 메시지 개수 조회 에러:', error);
    res.status(500).json({ 
      success: false, 
      message: '안 읽은 메시지 개수 조회 중 오류가 발생했습니다.' 
    });
  }
});

// @desc    최근 메시지 목록 조회
// @route   GET /api/messages/recent
// @access  Private
router.get('/recent', protect, async (req, res) => {
  try {
    if (!req.user.linkedUserId) {
      return res.json({
        success: true,
        data: { recentMessages: [] }
      });
    }

    const recentMessages = await Message.getMessagesBetweenUsers(
      req.user._id,
      req.user.linkedUserId,
      20
    );

    res.json({
      success: true,
      data: { recentMessages }
    });
  } catch (error) {
    console.error('최근 메시지 조회 에러:', error);
    res.status(500).json({ 
      success: false, 
      message: '최근 메시지 조회 중 오류가 발생했습니다.' 
    });
  }
});

module.exports = router; 