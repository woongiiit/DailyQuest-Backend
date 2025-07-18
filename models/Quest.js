const mongoose = require('mongoose');

const questItemSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: [true, '퀘스트 제목은 필수입니다.'],
    trim: true,
    maxlength: [100, '퀘스트 제목은 최대 100자까지 가능합니다.']
  },
  completed: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date,
    default: null
  },
  photo: {
    type: String,
    default: null
  }
}, { _id: false });

const dailyQuestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^\d{4}-\d{2}-\d{2}$/.test(v);
      },
      message: '날짜 형식이 올바르지 않습니다. (YYYY-MM-DD)'
    }
  },
  quests: {
    type: [questItemSchema],
    default: []
  },
  encouragementMessage: {
    type: String,
    default: null,
    maxlength: [200, '응원 메시지는 최대 200자까지 가능합니다.']
  },
  completionRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  }
}, {
  timestamps: true
});

// 완료율 계산 미들웨어
dailyQuestSchema.pre('save', function(next) {
  if (this.quests.length === 0) {
    this.completionRate = 0;
  } else {
    const completedCount = this.quests.filter(quest => quest.completed).length;
    this.completionRate = Math.round((completedCount / this.quests.length) * 100);
  }
  next();
});

// 사용자와 날짜로 고유 인덱스 생성
dailyQuestSchema.index({ userId: 1, date: 1 }, { unique: true });

// 기본 퀘스트 목록 생성 메서드
dailyQuestSchema.statics.getDefaultQuests = function() {
  return [
    {
      id: '1',
      title: '04시30분 기상하기',
      completed: false
    },
    {
      id: '2',
      title: '기상 후 15분 걷기',
      completed: false
    },
    {
      id: '3',
      title: '물 8잔 마시기',
      completed: false
    },
    {
      id: '4',
      title: '독서 30분하기',
      completed: false
    }
  ];
};

module.exports = mongoose.model('DailyQuest', dailyQuestSchema); 