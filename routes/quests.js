const express = require('express');
const DailyQuest = require('../models/Quest');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @desc    오늘의 퀘스트 조회 또는 생성
// @route   GET /api/quests/today
// @access  Private
router.get('/today', protect, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD 형식
    
    let dailyQuest = await DailyQuest.findOne({
      userId: req.user._id,
      date: today
    });

    if (!dailyQuest) {
      // 오늘의 퀘스트가 없으면 기본 퀘스트로 생성
      dailyQuest = await DailyQuest.create({
        userId: req.user._id,
        date: today,
        quests: DailyQuest.getDefaultQuests()
      });
    }

    res.json({
      success: true,
      data: { dailyQuest }
    });
  } catch (error) {
    console.error('오늘의 퀘스트 조회 에러:', error);
    res.status(500).json({ 
      success: false, 
      message: '퀘스트 조회 중 오류가 발생했습니다.' 
    });
  }
});

// @desc    특정 날짜의 퀘스트 조회
// @route   GET /api/quests/:date
// @access  Private
router.get('/:date', protect, async (req, res) => {
  try {
    const { date } = req.params;
    
    // 날짜 형식 검증
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ 
        success: false, 
        message: '날짜 형식이 올바르지 않습니다. (YYYY-MM-DD)' 
      });
    }

    const dailyQuest = await DailyQuest.findOne({
      userId: req.user._id,
      date: date
    });

    if (!dailyQuest) {
      return res.status(404).json({ 
        success: false, 
        message: '해당 날짜의 퀘스트를 찾을 수 없습니다.' 
      });
    }

    res.json({
      success: true,
      data: { dailyQuest }
    });
  } catch (error) {
    console.error('특정 날짜 퀘스트 조회 에러:', error);
    res.status(500).json({ 
      success: false, 
      message: '퀘스트 조회 중 오류가 발생했습니다.' 
    });
  }
});

// @desc    퀘스트 업데이트
// @route   PUT /api/quests/:date
// @access  Private
router.put('/:date', protect, async (req, res) => {
  try {
    const { date } = req.params;
    const { quests, encouragementMessage } = req.body;

    // 날짜 형식 검증
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ 
        success: false, 
        message: '날짜 형식이 올바르지 않습니다. (YYYY-MM-DD)' 
      });
    }

    let dailyQuest = await DailyQuest.findOne({
      userId: req.user._id,
      date: date
    });

    if (!dailyQuest) {
      return res.status(404).json({ 
        success: false, 
        message: '해당 날짜의 퀘스트를 찾을 수 없습니다.' 
      });
    }

    // 퀘스트 업데이트
    if (quests) {
      dailyQuest.quests = quests;
    }

    if (encouragementMessage !== undefined) {
      dailyQuest.encouragementMessage = encouragementMessage;
    }

    await dailyQuest.save();

    res.json({
      success: true,
      message: '퀘스트가 업데이트되었습니다.',
      data: { dailyQuest }
    });
  } catch (error) {
    console.error('퀘스트 업데이트 에러:', error);
    res.status(500).json({ 
      success: false, 
      message: '퀘스트 업데이트 중 오류가 발생했습니다.' 
    });
  }
});

// @desc    연동된 사용자의 퀘스트 조회
// @route   GET /api/quests/linked/:date
// @access  Private
router.get('/linked/:date', protect, async (req, res) => {
  try {
    const { date } = req.params;

    if (!req.user.linkedUserId) {
      return res.status(404).json({ 
        success: false, 
        message: '연동된 사용자가 없습니다.' 
      });
    }

    // 날짜 형식 검증
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ 
        success: false, 
        message: '날짜 형식이 올바르지 않습니다. (YYYY-MM-DD)' 
      });
    }

    const linkedUserQuest = await DailyQuest.findOne({
      userId: req.user.linkedUserId,
      date: date
    });

    if (!linkedUserQuest) {
      return res.status(404).json({ 
        success: false, 
        message: '연동된 사용자의 해당 날짜 퀘스트를 찾을 수 없습니다.' 
      });
    }

    // 연동된 사용자 정보도 함께 조회
    const linkedUser = await User.findById(req.user.linkedUserId)
      .select('nickname profileImage');

    res.json({
      success: true,
      data: { 
        dailyQuest: linkedUserQuest,
        linkedUser
      }
    });
  } catch (error) {
    console.error('연동 사용자 퀘스트 조회 에러:', error);
    res.status(500).json({ 
      success: false, 
      message: '연동 사용자 퀘스트 조회 중 오류가 발생했습니다.' 
    });
  }
});

// @desc    월별 퀘스트 조회
// @route   GET /api/quests/month/:year/:month
// @access  Private
router.get('/month/:year/:month', protect, async (req, res) => {
  try {
    const { year, month } = req.params;
    
    // 년월 형식 검증
    if (!/^\d{4}$/.test(year) || !/^\d{1,2}$/.test(month)) {
      return res.status(400).json({ 
        success: false, 
        message: '년월 형식이 올바르지 않습니다.' 
      });
    }

    const startDate = `${year}-${month.padStart(2, '0')}-01`;
    const endDate = `${year}-${month.padStart(2, '0')}-31`;

    const monthlyQuests = await DailyQuest.find({
      userId: req.user._id,
      date: {
        $gte: startDate,
        $lte: endDate
      }
    }).sort({ date: 1 });

    res.json({
      success: true,
      data: { monthlyQuests }
    });
  } catch (error) {
    console.error('월별 퀘스트 조회 에러:', error);
    res.status(500).json({ 
      success: false, 
      message: '월별 퀘스트 조회 중 오류가 발생했습니다.' 
    });
  }
});

// @desc    퀘스트 완료 상태 토글
// @route   PATCH /api/quests/:date/toggle/:questId
// @access  Private
router.patch('/:date/toggle/:questId', protect, async (req, res) => {
  try {
    const { date, questId } = req.params;

    let dailyQuest = await DailyQuest.findOne({
      userId: req.user._id,
      date: date
    });

    if (!dailyQuest) {
      return res.status(404).json({ 
        success: false, 
        message: '해당 날짜의 퀘스트를 찾을 수 없습니다.' 
      });
    }

    // 특정 퀘스트 찾기
    const questIndex = dailyQuest.quests.findIndex(quest => quest.id === questId);
    if (questIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        message: '해당 퀘스트를 찾을 수 없습니다.' 
      });
    }

    // 완료 상태 토글
    dailyQuest.quests[questIndex].completed = !dailyQuest.quests[questIndex].completed;
    
    if (dailyQuest.quests[questIndex].completed) {
      dailyQuest.quests[questIndex].completedAt = new Date();
    } else {
      dailyQuest.quests[questIndex].completedAt = null;
    }

    await dailyQuest.save();

    res.json({
      success: true,
      message: '퀘스트 상태가 업데이트되었습니다.',
      data: { dailyQuest }
    });
  } catch (error) {
    console.error('퀘스트 토글 에러:', error);
    res.status(500).json({ 
      success: false, 
      message: '퀘스트 상태 업데이트 중 오류가 발생했습니다.' 
    });
  }
});

module.exports = router; 