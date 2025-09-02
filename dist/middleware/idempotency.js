export function requireIdempotencyKey(req, res, next) {
    if (req.method === "POST") {
        const key = req.header("Idempotency-Key") || req.header("idempotency-key");
        if (!key)
            return res.status(400).json({ error: "Idempotency-Key header is required" });
    }
    next();
}
//# sourceMappingURL=idempotency.js.map