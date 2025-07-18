const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  fromUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  toUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  message: {
    type: String,
    required: [true, '메시지 내용은 필수입니다.'],
    trim: true,
    maxlength: [200, '메시지는 최대 200자까지 가능합니다.']
  },
  questDate: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^\d{4}-\d{2}-\d{2}$/.test(v);
      },
      message: '날짜 형식이 올바르지 않습니다. (YYYY-MM-DD)'
    }
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// 메시지 읽음 처리 메서드
messageSchema.methods.markAsRead = function() {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

// 사용자 간 메시지 조회 메서드
messageSchema.statics.getMessagesBetweenUsers = function(userId1, userId2, limit = 50) {
  return this.find({
    $or: [
      { fromUserId: userId1, toUserId: userId2 },
      { fromUserId: userId2, toUserId: userId1 }
    ]
  })
  .sort({ createdAt: -1 })
  .limit(limit)
  .populate('fromUserId', 'nickname profileImage')
  .populate('toUserId', 'nickname profileImage');
};

module.exports = mongoose.model('Message', messageSchema); 