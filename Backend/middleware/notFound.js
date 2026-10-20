/**
 * 404 Not Found Handler Middleware
 */
const notFound = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Endpoint not found: [${req.method}] ${req.originalUrl}`,
    hint: 'Check the route path and HTTP method in the YatraGo API documentation.',
  });
};

module.exports = notFound;
