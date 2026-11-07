
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from "recharts";

const data = [
  { day: "Mon", members: 45 },
  { day: "Tue", members: 62 },
  { day: "Wed", members: 55 },
  { day: "Thu", members: 78 },
  { day: "Fri", members: 68 },
  { day: "Sat", members: 90 },
  { day: "Sun", members: 72 }
];

function AttendanceChart() {
  return (
    <div className="chart-card">

      <div className="section-heading">
        <div>
          <h3>Attendance Overview</h3>
          <p>Weekly attendance statistics</p>
        </div>

        <span className="chart-badge">This Week</span>
      </div>

      <div className="chart-area">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>

            <defs>
              <linearGradient id="attendanceColor" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              stroke="#252b38"
              strokeDasharray="4 4"
            />

            <XAxis
              dataKey="day"
              stroke="#8992a3"
              tickLine={false}
              axisLine={false}
            />

            <YAxis
              stroke="#8992a3"
              tickLine={false}
              axisLine={false}
            />

            <Tooltip
              contentStyle={{
                background: "#171c28",
                border: "1px solid #30394a",
                borderRadius: "10px",
                color: "#fff"
              }}
            />

            <Area
              type="monotone"
              dataKey="members"
              stroke="#22d3ee"
              strokeWidth={3}
              fill="url(#attendanceColor)"
            />

          </AreaChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
}

export default AttendanceChart;
