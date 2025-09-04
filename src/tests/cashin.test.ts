import mongoose from "mongoose";
import { cashInService } from "../services/cashin.service";
import { Transfer } from "../models/transfer.model";
import { User } from "../models/user.model";
import { Company } from "../models/company.model";

describe("cashInService - Scenario A (Cash In)", () => {
  afterEach(() => jest.restoreAllMocks());

  test("Company cashes in 150000 to User1 with fee 150", async () => {
    const companyMock: any = {
      _id: "AYA Bank",
      balance: 10000000,
      save: jest.fn(),
    };

    const userMock: any = { _id: "u1", balance: 0, save: jest.fn() };

    const sessionMock: any = {
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      abortTransaction: jest.fn(),
      endSession: jest.fn(),
    };

    jest.spyOn(Transfer, "findOne").mockResolvedValue(null as any);

    jest.spyOn(Company, "findById").mockResolvedValue(companyMock as any);
    jest.spyOn(User, "findById").mockResolvedValue(userMock as any);

    jest.spyOn(Transfer, "create").mockResolvedValue([
      {
        type: "cashin",
        fromCompanyId: companyMock._id,
        toUserId: userMock._id,
        amount: 150000,
        fee: 150,
        feeType: "credit",
        status: "SUCCESS",
      },
    ] as any);

    jest.spyOn(mongoose, "startSession").mockResolvedValue(sessionMock as any);

    const req: any = {
      header: () => "idem",
      body: { userId: "u1", amount: 150000 },
    };

    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const res: any = { status };

    await cashInService(req as any, res as any);

    // balances after cash in
    expect(userMock.balance).toBe(149850);
    expect(companyMock.balance).toBe(9850150);

    expect(userMock.save).toHaveBeenCalled();
    expect(companyMock.save).toHaveBeenCalled();
    expect(Transfer.create).toHaveBeenCalled();
    expect(status).toHaveBeenCalledWith(201);

    const responseBody = json.mock.calls[0][0];
    expect(responseBody.cashIn[0].fee).toBe(150);
    expect(responseBody.cashIn[0].feeType).toBe("credit");
    expect(responseBody.cashIn[0].status).toBe("SUCCESS");
  });
});
