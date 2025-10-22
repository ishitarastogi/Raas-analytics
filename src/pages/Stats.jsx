import React, { useEffect, useState } from "react";
import { RaaS_CHAINS } from "../data/raasChains";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend,
} from "recharts";

export default function Stats() {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      const results = await Promise.all(
        RaaS_CHAINS.map(async (chain) => {
          try {
            const res = await fetch(chain.api);
            const json = await res.json();
            return {
              name: chain.name,
              avgBlockTime: json.average_block_time / 1000, // convert ms → s
              totalTx: parseInt(json.total_transactions),
              totalAddr: parseInt(json.total_addresses),
            };
          } catch {
            return { name: chain.name, avgBlockTime: 0, totalTx: 0, totalAddr: 0 };
          }
        })
      );
      setStats(results);
      setLoading(false);
    }
    fetchStats();
  }, []);

  if (loading) return <div className="loading">Loading chain stats…</div>;

  return (
    <div className="stats-page">
      <h2>RaaS Network Stats Overview</h2>

      <div className="chart-section">
        <h3>Total Transactions</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={stats} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="totalTx" fill="#66b3ff" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-section">
        <h3>Average Block Time (seconds)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={stats}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="avgBlockTime" fill="#7ef0c1" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-section">
        <h3>Total Addresses</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={stats}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="totalAddr" fill="#ffd287" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <table className="stats-table">
        <thead>
          <tr>
            <th>Chain</th>
            <th>Avg Block Time (s)</th>
            <th>Total Tx</th>
            <th>Total Addresses</th>
          </tr>
        </thead>
        <tbody>
          {stats.map((s) => (
            <tr key={s.name}>
              <td>{s.name}</td>
              <td>{s.avgBlockTime}</td>
              <td>{s.totalTx.toLocaleString()}</td>
              <td>{s.totalAddr.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
