function DashboardPage() {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 shadow-lg">
      <h1 className="text-xl font-semibold mb-4 text-slate-100">
        Dashboard
      </h1>
      <p className="text-sm text-slate-300 mb-2">
        This is a placeholder customer dashboard.
      </p>
      <ul className="text-sm text-slate-300 list-disc ml-5 space-y-1">
        <li>Later: show list of accounts from Account service</li>
        <li>Later: show recent transactions from Transaction service</li>
        <li>Later: show notifications & flags</li>
      </ul>
    </div>
  );
}

export default DashboardPage;
