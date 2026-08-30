// Wraps async route handlers so any thrown error automatically gets
// forwarded to the global error handler via next(err).

function catchAsync(fn) {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}

module.exports = catchAsync;
