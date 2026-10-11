import { AgencyModel } from "../models/Agency.js";
import { CallModel } from "../models/Call.js";
import { UserModel } from "../models/User.js";

export async function getAdminDashboard() {
  const [
    totalAgencies,
    activeAgencies,
    totalTelecallers,
  ] = await Promise.all([
    AgencyModel.countDocuments(),
    AgencyModel.countDocuments({
      status: "active",
    }),
    UserModel.countDocuments({
      role: "telecaller",
    }),
  ]);

    const today = new Date();

  const startDate = new Date(
    Date.UTC(
      today.getUTCFullYear(),
      today.getUTCMonth(),
      today.getUTCDate() - 6,
    ),
  );

  const callRecords = await CallModel.aggregate<{
    _id: string;
    calls: number;
  }>([
    {
      $match: {
        startedAt: {
          $gte: startDate,
        },
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
  ]);

  const callsByDate = new Map(
    callRecords.map((record) => [record._id, record.calls]),
  );

  const callActivity = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(startDate);
    date.setUTCDate(startDate.getUTCDate() + index);

    const dateKey = date.toISOString().slice(0, 10);

    return {
      date: dateKey,
      calls: callsByDate.get(dateKey) ?? 0,
    };
  });

    const recentAgencies = await AgencyModel.find()
    .sort({ createdAt: -1 })
    .limit(5)
    .select("name status createdAt")
    .lean();

  const latestAgencies = recentAgencies.map((agency) => ({
    id: String(agency._id),
    name: agency.name,
    status: agency.status,
    createdAt: agency.createdAt,
  }));

  return {
    stats: {
      totalAgencies,
      activeAgencies,
       totalTelecallers,
    },
        callActivity,
    latestAgencies,
  };
}