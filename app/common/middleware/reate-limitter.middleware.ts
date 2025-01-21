import rateLimit from "express-rate-limit";

/**
 * Basic rate limiter configuration.
 * Limits requests to 100 per 15 minutes per IP.
 */
export const rateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: "Too many requests from this IP, please try again after 15 minutes.",
    headers: true, // Sends X-RateLimit headers
    standardHeaders: true, // Include rate limit info in `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers (deprecated)
});
