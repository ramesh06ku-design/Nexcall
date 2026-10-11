
import { AgencyModel } from "../models/Agency.js";
import { UserModel } from "../models/User.js";
import { LeadModel } from "../models/Lead.js";
import { CallModel } from "../models/Call.js";

export async function getAdminAnalytics() {
  const [
    totalAgencies,
    activeAgencies,
    totalTelecallers,
    totalLeads,
    totalCalls,
  ] = await Promise.all([
    AgencyModel.countDocuments(),

    AgencyModel.countDocuments({
      status: "active",
    }),

    UserModel.countDocuments({
      role: "telecaller",
    }),

    LeadModel.countDocuments(),

    CallModel.countDocuments(),
  ]);

  // Last 7 days, including today (UTC)
  const today = new Date();

  const startDate = new Date(
    Date.UTC(
      today.getUTCFullYear(),
      today.getUTCMonth(),
      today.getUTCDate() - 6,
    ),
  );

  const callStats = await CallModel.aggregate<{
    _id: string;
    calls: number;
  }>([
    {
      $match: {
        startedAt: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: "%Y-%m-%d",
            date: "$startedAt",
            timezone: "UTC",
          },
        },
        calls: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const callCounts = new Map(
    callStats.map((item) => [item._id, item.calls]),
  );

  const callActivity = Array.from(
    { length: 7 },
    (_, index) => {
      const date = new Date(startDate);

      date.setUTCDate(
        startDate.getUTCDate() + index,
      );

      const key = date.toISOString().slice(0, 10);

      return {
        date: key,
        calls: callCounts.get(key) ?? 0,
      };
    },
  );

  return {
    summary: {
      totalAgencies,
      activeAgencies,
      totalTelecallers,
      totalLeads,
      totalCalls,
    },
    callActivity,
  };
}
