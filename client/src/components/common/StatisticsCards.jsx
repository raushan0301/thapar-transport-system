import React from 'react';
import { TrendingUp, CheckCircle, XCircle, Users, Clock, Award } from 'lucide-react';

const StatisticsCards = ({ logs }) => {
    // Calculate statistics
    const totalApprovals = logs.length;
    const approvedCount = logs.filter(log => log.action === 'approved').length;
    const rejectedCount = logs.filter(log => log.action === 'rejected').length;
    const approvalRate = totalApprovals > 0 ? ((approvedCount / totalApprovals) * 100).toFixed(1) : 0;

    // Calculate average approval time
    const calculateAvgTime = () => {
        const times = logs
            .filter(log => log.request?.submitted_at && log.approved_at)
            .map(log => {
                const submitted = new Date(log.request.submitted_at);
                const approved = new Date(log.approved_at);
                return (approved - submitted) / (1000 * 60 * 60); // hours
            });

        if (times.length === 0) return 'N/A';
        const avgHours = times.reduce((a, b) => a + b, 0) / times.length;
        const days = Math.floor(avgHours / 24);
        const hours = Math.floor(avgHours % 24);
        return days > 0 ? `${days}d ${hours}h` : `${hours}h`;
    };

    // Find most active approver
    const getMostActiveApprover = () => {
        const approverCounts = {};
        logs.forEach(log => {
            const name = log.approver?.full_name || 'Unknown';
            approverCounts[name] = (approverCounts[name] || 0) + 1;
        });

        const entries = Object.entries(approverCounts);
        if (entries.length === 0) return 'N/A';

        const [name, count] = entries.reduce((max, entry) =>
            entry[1] > max[1] ? entry : max
        );
        return `${name} (${count})`;
    };

    const stats = [
        {
            title: 'Total Approvals',
            value: totalApprovals,
            icon: TrendingUp,
            color: 'blue',
            bgColor: 'bg-blue-100',
            textColor: 'text-blue-600'
        },
        {
            title: 'Approved',
            value: approvedCount,
            icon: CheckCircle,
            color: 'green',
            bgColor: 'bg-green-100',
            textColor: 'text-green-600'
        },
        {
            title: 'Rejected',
            value: rejectedCount,
            icon: XCircle,
            color: 'red',
            bgColor: 'bg-red-100',
            textColor: 'text-red-600'
        },
        {
            title: 'Approval Rate',
            value: `${approvalRate}%`,
            icon: Award,
            color: 'purple',
            bgColor: 'bg-purple-100',
            textColor: 'text-purple-600'
        },
        {
            title: 'Avg Approval Time',
            value: calculateAvgTime(),
            icon: Clock,
            color: 'amber',
            bgColor: 'bg-amber-100',
            textColor: 'text-amber-600'
        },
        {
            title: 'Most Active Approver',
            value: getMostActiveApprover(),
            icon: Users,
            color: 'indigo',
            bgColor: 'bg-indigo-100',
            textColor: 'text-indigo-600',
            valueClass: 'text-lg' // Smaller text for long names
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
            {stats.map((stat, index) => (
                <div
                    key={index}
                    className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                    style={{
                        animation: 'slideUp 0.6s ease-out forwards',
                        animationDelay: `${index * 50}ms`,
                        opacity: 0
                    }}
                >
                    <div className="flex items-center justify-between mb-3">
                        <div className={`w-10 h-10 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                            <stat.icon className={`w-5 h-5 ${stat.textColor}`} strokeWidth={2} />
                        </div>
                    </div>
                    <div className={stat.valueClass || 'text-2xl font-bold text-gray-900 mb-1'}>
                        {stat.value}
                    </div>
                    <div className="text-sm text-gray-600">{stat.title}</div>
                </div>
            ))}
        </div>
    );
};

export default StatisticsCards;
