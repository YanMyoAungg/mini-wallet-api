import type { Request, Response, NextFunction } from "express";
export declare function requireIdempotencyKey(req: Request, res: Response, next: NextFunction): Response<any, Record<string, any>> | undefined;
//# sourceMappingURL=idempotency.d.ts.map