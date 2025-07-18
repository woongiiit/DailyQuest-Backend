const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Mongoose 중복 키 에러
  if (err.code === 11000) {
    const message = '이미 존재하는 데이터입니다.';
    error = { message, statusCode: 400 };
  }

  // Mongoose 유효성 검사 에러
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = { message, statusCode: 400 };
  }

  // Mongoose 잘못된 ObjectId 에러
  if (err.name === 'CastError') {
    const message = '잘못된 ID 형식입니다.';
    error = { message, statusCode: 400 };
  }

  // JWT 에러
  if (err.name === 'JsonWebTokenError') {
    const message = '유효하지 않은 토큰입니다.';
    error = { message, statusCode: 401 };
  }

  // JWT 만료 에러
  if (err.name === 'TokenExpiredError') {
    const message = '토큰이 만료되었습니다.';
    error = { message, statusCode: 401 };
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || '서버 내부 오류가 발생했습니다.',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = { errorHandler }; 