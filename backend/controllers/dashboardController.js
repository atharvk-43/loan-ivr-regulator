/**
 * @fileoverview Dashboard controller for compiling analytics, stats, and chart datasets.
 * Performs aggregation queries on Customer and CallLog collections.
 */

const Customer = require('../models/Customer');
const CallLog = require('../models/CallLog');

/**
 * @desc    Get aggregated high-level statistics for dashboard cards
 * @route   GET /api/dashboard/stats
 * @access  Private
 */
const getStats = async (req, res) => {
  try {
    // 1. Total number of customers
    const totalCustomers = await Customer.countDocuments();

    // 2. Pending/Overdue payments counts
    const pendingPayments = await Customer.countDocuments({
      paymentStatus: { $in: ['pending', 'overdue', 'promised', 'paid_pending_verification'] },
    });

    // 3. Call status tallies (Successful vs Failed)
    // Successful calls: answered or completed
    const successfulCalls = await Customer.countDocuments({
      callStatus: { $in: ['answered', 'completed', 'in-progress'] },
    });

    // Failed calls: failed, no-answer, busy
    const failedCalls = await Customer.countDocuments({
      callStatus: { $in: ['failed', 'no-answer', 'busy'] },
    });

    // 4. Sum of all due amounts where payment is not fully settled ('paid')
    const dueAmountAggregate = await Customer.aggregate([
      {
        $match: {
          paymentStatus: { $ne: 'paid' },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$dueAmount' },
        },
      },
    ]);
    const totalDueAmount = dueAmountAggregate.length > 0 ? dueAmountAggregate[0].total : 0;

    // 5. Total number of calls placed today
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const callsToday = await CallLog.countDocuments({
      createdAt: { $gte: startOfToday },
    });

    res.status(200).json({
      success: true,
      stats: {
        totalCustomers,
        pendingPayments,
        successfulCalls,
        failedCalls,
        totalDueAmount,
        callsToday,
      },
    });
  } catch (error) {
    console.error('❌ GetStats error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error compiling dashboard analytics stats',
    });
  }
};

/**
 * @desc    Get chart time-series data for call performance metrics
 * @route   GET /api/dashboard/chart-data
 * @access  Private
 */
const getChartData = async (req, res) => {
  try {
    const days = parseInt(req.query.days, 10) || 7;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days + 1);
    startDate.setHours(0, 0, 0, 0);

    // Group call logs by day and call outcome
    const callLogsAggregate = await CallLog.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
        },
      },
      {
        $project: {
          dayString: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          status: 1,
        },
      },
      {
        $group: {
          _id: { day: '$dayString', status: '$status' },
          count: { $sum: 1 },
        },
      },
    ]);

    // Construct a dictionary of the aggregated data: { 'YYYY-MM-DD': { total, successful, failed } }
    const statsByDay = {};

    callLogsAggregate.forEach((item) => {
      const day = item._id.day;
      const status = item._id.status;
      const count = item.count;

      if (!statsByDay[day]) {
        statsByDay[day] = { date: day, total: 0, successful: 0, failed: 0 };
      }

      statsByDay[day].total += count;

      // Group statuses into binary categories
      if (['answered', 'completed', 'in-progress'].includes(status)) {
        statsByDay[day].successful += count;
      } else if (['failed', 'no-answer', 'busy', 'canceled'].includes(status)) {
        statsByDay[day].failed += count;
      }
    });

    // Generate full list of days to ensure gaps with zero calls are filled
    const chartData = [];
    const tempDate = new Date(startDate);

    for (let i = 0; i < days; i++) {
      const dayString = tempDate.toISOString().split('T')[0];

      if (statsByDay[dayString]) {
        chartData.push(statsByDay[dayString]);
      } else {
        chartData.push({
          date: dayString,
          total: 0,
          successful: 0,
          failed: 0,
        });
      }

      tempDate.setDate(tempDate.getDate() + 1);
    }

    // Format dates for front-end charts (e.g., "May 26")
    const formattedData = chartData.map((item) => {
      const dateParts = item.date.split('-');
      const dateObj = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
      const formattedLabel = dateObj.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });

      return {
        ...item,
        label: formattedLabel,
      };
    });

    res.status(200).json({
      success: true,
      data: formattedData,
    });
  } catch (error) {
    console.error('❌ GetChartData error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error generating chart time-series data',
    });
  }
};

module.exports = {
  getStats,
  getChartData,
};
