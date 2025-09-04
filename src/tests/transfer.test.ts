import mongoose from "mongoose";
import { transferService } from "../services/transfer.service";
import { Transfer } from "../models/transfer.model";
import { User } from "../models/user.model";
import { Company } from "../models/company.model";

describe("transferService - Scenario Tests", () => {
  afterEach(() => jest.restoreAllMocks());

  test("Scenario B: User1 transfers 100,000 to User2 with no fee", async () => {
    const companyMock: any = {
      _id: "AYA Bank",
      balance: 9850150,
      save: jest.fn(),
    };

    const fromUser: any = { _id: "user1", balance: 149850, save: jest.fn() };
    const toUser: any = { _id: "user2", balance: 0, save: jest.fn() };

    const sessionMock: any = {
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      abortTransaction: jest.fn(),
      endSession: jest.fn(),
    };

    jest.spyOn(Company, "findById").mockImplementation(
      () =>
        ({
          session: jest.fn().mockReturnValue(Promise.resolve(companyMock)),
        } as any)
    );

    jest.spyOn(User, "findById").mockImplementation(
      (id: any) =>
        ({
          session: jest
            .fn()
            .mockReturnValue(
              Promise.resolve(String(id) === "user1" ? fromUser : toUser)
            ),
        } as any)
    );

    jest
      .spyOn(Transfer, "findOne")
      .mockImplementation(
        () =>
          ({ session: jest.fn().mockReturnValue(Promise.resolve(null)) } as any)
      );

    jest.spyOn(Transfer, "create").mockResolvedValue([
      {
        type: "transfer",
        fromUserId: fromUser._id,
        toUserId: toUser._id,
        amount: 100000,
        fee: 0,
        feeType: "debit",
        status: "SUCCESS",
      },
    ] as any);

    jest.spyOn(mongoose, "startSession").mockResolvedValue(sessionMock as any);

    const req: any = {
      header: (key: string) =>
        key.toLowerCase() === "idempotency-key" ? "idem" : undefined,
      body: { fromUserId: "user1", toUserId: "user2", amount: 100000 },
    };

    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const res: any = { status };

    await transferService(req as any, res as any);

    expect(fromUser.balance).toBe(49850);
    expect(toUser.balance).toBe(100000);
    expect(companyMock.balance).toBe(9850150);

    expect(fromUser.save).toHaveBeenCalled();
    expect(toUser.save).toHaveBeenCalled();
    expect(companyMock.save).toHaveBeenCalled();
    expect(Transfer.create).toHaveBeenCalled();
    expect(status).toHaveBeenCalledWith(201);

    const responseBody = json.mock.calls[0][0];
    expect(responseBody.fee).toBe(0);
    expect(responseBody.feeType).toBe("debit");
    expect(responseBody.status).toBe("SUCCESS");
  });

  test("Scenario C: User2 attempts to transfer 200,000 to User3 but insufficient funds", async () => {
    const companyMock: any = {
      _id: "AYA Bank",
      balance: 9850150,
      save: jest.fn(),
    };

    const fromUser: any = { _id: "user2", balance: 100000, save: jest.fn() };
    const toUser: any = { _id: "user3", balance: 0, save: jest.fn() };

    const sessionMock: any = {
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      abortTransaction: jest.fn(),
      endSession: jest.fn(),
    };

    jest.spyOn(Company, "findById").mockImplementation(
      () =>
        ({
          session: jest.fn().mockReturnValue(Promise.resolve(companyMock)),
        } as any)
    );

    jest.spyOn(User, "findById").mockImplementation(
      (id: any) =>
        ({
          session: jest
            .fn()
            .mockReturnValue(
              Promise.resolve(String(id) === "user2" ? fromUser : toUser)
            ),
        } as any)
    );

    jest
      .spyOn(Transfer, "findOne")
      .mockImplementation(
        () =>
          ({ session: jest.fn().mockReturnValue(Promise.resolve(null)) } as any)
      );

    jest.spyOn(Transfer, "create").mockResolvedValue([
      {
        type: "transfer",
        fromUserId: fromUser._id,
        toUserId: toUser._id,
        amount: 200000,
        fee: 100,
        feeType: "debit",
        status: "FAILED",
      },
    ] as any);

    jest.spyOn(mongoose, "startSession").mockResolvedValue(sessionMock as any);

    const req: any = {
      header: (key: string) =>
        key.toLowerCase() === "idempotency-key" ? "idem" : undefined,
      body: { fromUserId: "user1", toUserId: "user2", amount: 100000 },
    };

    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const res: any = { status };

    await transferService(req as any, res as any);

    expect(fromUser.balance).toBe(100000); // unchanged
    expect(toUser.balance).toBe(0);
    expect(companyMock.balance).toBe(9850150); // unchanged

    expect(Transfer.create).toHaveBeenCalled();
    expect(status).toHaveBeenCalledWith(201);

    const responseBody = json.mock.calls[0][0];
    expect(responseBody.error).toBe("INSUFFICIENT_FUNDS");
    expect(responseBody.transaction.status).toBe("FAILED");
    expect(responseBody.transaction.fee).toBe(100);
    expect(responseBody.transaction.feeType).toBe("debit");
  });
});
