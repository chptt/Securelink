"use client";

import { motion } from "framer-motion";
import { Upload, ShoppingBag, Coins, ArrowUpRight } from "lucide-react";

interface DashboardStatsProps {
  uploadedCount: number;
  purchasedCount: number;
  earnings: number;
  transactionCount: number;
}

export function DashboardStats({
  uploadedCount,
  purchasedCount,
  earnings,
  transactionCount,
}: DashboardStatsProps) {
  const stats = [
    {
      label: "Videos Uploaded",
      value: uploadedCount,
      icon: Upload,
      color: "cyan",
      suffix: "",
    },
    {
      label: "Videos Purchased",
      value: purchasedCount,
      icon: ShoppingBag,
      color: "violet",
      suffix: "",
    },
    {
      label: "Total Earnings",
      value: earnings.toFixed(2),
      icon: Coins,
      color: "cyan",
      suffix: " SUI",
    },
    {
      label: "Transactions",
      value: transactionCount,
      icon: ArrowUpRight,
      color: "violet",
      suffix: "",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="glass rounded-2xl p-5 border border-white/5"
        >
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
            stat.color === "cyan"
              ? "bg-cyan-500/10 border border-cyan-500/20"
              : "bg-violet-500/10 border border-violet-500/20"
          }`}>
            <stat.icon className={`w-5 h-5 ${
              stat.color === "cyan" ? "text-cyan-400" : "text-violet-400"
            }`} />
          </div>
          <div className="text-2xl font-bold gradient-text">
            {stat.value}{stat.suffix}
          </div>
          <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
        </motion.div>
      ))}
    </div>
  );
}
