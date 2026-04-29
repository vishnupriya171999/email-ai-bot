function errorHandler(error, _req, res, _next) {
  console.error(error);
  const status = error.statusCode || 500;
  const message = error.message || "Internal server error";
  res.status(status).json({ message });
}

module.exports = {
  errorHandler,
};

