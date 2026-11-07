
function StatCard({ title, value, change, icon: Icon, color }) {
  return (
    <div className="stat-card">

      <div className="stat-top">
        <span>{title}</span>

        <div
          className="stat-icon"
          style={{ color, background: `${color}18` }}
        >
          <Icon size={22} />
        </div>
      </div>

      <h2>{value}</h2>

      <p className="stat-change">
        <span>{change}</span> from last month
      </p>

    </div>
  );
}

export default StatCard;
