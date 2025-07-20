import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { BarChart3, DollarSign, Clock, AlertCircle, TrendingUp, Calendar, Zap } from 'lucide-react';

const ImpactVisualizer = () => {
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState('30');
  const [impactMetrics, setImpactMetrics] = useState({});

  const impactColors = {
    'Significant': '#dc2626',
    'Moderate': '#f59e0b', 
    'Informational': '#10b981'
  };

  const sectorColors = [
    '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', 
    '#ef4444', '#06b6d4', '#8b5f2b', '#ec4899'
  ];

  useEffect(() => {
    fetchImpactData();
  }, [selectedTimeframe]);

  const fetchImpactData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/updates?limit=100&enhanced=true`);
      const data = await response.json();
      setUpdates(data || []);
      calculateImpactMetrics(data || []);
    } catch (error) {
      console.error('Failed to fetch impact data:', error);
      setUpdates([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateImpactMetrics = (allUpdates) => {
    const days = parseInt(selectedTimeframe);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const filteredUpdates = allUpdates.filter(update => 
      new Date(update.fetched_date) >= cutoffDate
    );

    // Impact Level Distribution
    const impactDistribution = {
      'Significant': 0,
      'Moderate': 0, 
      'Informational': 0
    };

    // Sector Impact Analysis
    const sectorImpact = {};
    
    // Authority Activity
    const authorityActivity = {};
    
    // Timeline Analysis
    const timelineData = {};

    filteredUpdates.forEach(update => {
      // Impact level count
      const impact = update.impact_level || 'Informational';
      impactDistribution[impact] = (impactDistribution[impact] || 0) + 1;

      // Sector impact scoring
      if (update.sector_relevance_scores) {
        Object.entries(update.sector_relevance_scores).forEach(([sector, score]) => {
          if (score > 20) { // Only count meaningful relevance
            if (!sectorImpact[sector]) {
              sectorImpact[sector] = { count: 0, totalScore: 0, avgScore: 0 };
            }
            sectorImpact[sector].count++;
            sectorImpact[sector].totalScore += score;
            sectorImpact[sector].avgScore = sectorImpact[sector].totalScore / sectorImpact[sector].count;
          }
        });
      }

      // Authority activity
      const authority = update.authority || 'Unknown';
      authorityActivity[authority] = (authorityActivity[authority] || 0) + 1;

      // Timeline data (last 14 days)
      const dateKey = new Date(update.fetched_date).toISOString().split('T')[0];
      if (!timelineData[dateKey]) {
        timelineData[dateKey] = { date: dateKey, count: 0, highImpact: 0 };
      }
      timelineData[dateKey].count++;
      if (impact === 'Significant') {
        timelineData[dateKey].highImpact++;
      }
    });

    setImpactMetrics({
      impactDistribution,
      sectorImpact,
      authorityActivity,
      timelineData: Object.values(timelineData).sort((a, b) => a.date.localeCompare(b.date)),
      totalUpdates: filteredUpdates.length,
      highImpactCount: impactDistribution['Significant'] || 0
    });
  };

  const getImpactDistributionData = () => {
    return Object.entries(impactMetrics.impactDistribution || {}).map(([level, count]) => ({
      name: level,
      value: count,
      color: impactColors[level]
    }));
  };

  const getSectorImpactData = () => {
    return Object.entries(impactMetrics.sectorImpact || {})
      .sort(([,a], [,b]) => b.avgScore - a.avgScore)
      .slice(0, 8)
      .map(([sector, data]) => ({
        sector: sector.replace(' Management', '').replace(' Markets', ''),
        score: Math.round(data.avgScore),
        count: data.count
      }));
  };

  const getAuthorityActivityData = () => {
    return Object.entries(impactMetrics.authorityActivity || {})
      .sort(([,a], [,b]) => b - a)
      .slice(0, 6)
      .map(([authority, count]) => ({
        authority: authority.replace('Financial Conduct Authority', 'FCA')
                          .replace('Prudential Regulation Authority', 'PRA')
                          .replace('Bank of England', 'BoE'),
        count
      }));
  };

  const getBusinessImpactScore = () => {
    const { highImpactCount, totalUpdates } = impactMetrics;
    if (!totalUpdates) return 0;
    
    const impactRatio = (highImpactCount / totalUpdates) * 100;
    return Math.min(100, Math.round(impactRatio * 2)); // Scale to make it more meaningful
  };

  const getComplianceBurden = () => {
    const sectorData = getSectorImpactData();
    const avgScore = sectorData.reduce((sum, item) => sum + item.score, 0) / sectorData.length;
    return Math.round(avgScore || 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Calculating impact analysis...</span>
      </div>
    );
  }

  const impactDistributionData = getImpactDistributionData();
  const sectorImpactData = getSectorImpactData();
  const authorityActivityData = getAuthorityActivityData();
  const businessImpactScore = getBusinessImpactScore();
  const complianceBurden = getComplianceBurden();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 rounded-lg">
        <h1 className="text-2xl font-bold flex items-center">
          <BarChart3 className="mr-3" />
          Business Impact Visualizer
        </h1>
        <p className="text-purple-100 mt-1">
          Quantified regulatory impact analysis and compliance burden assessment
        </p>
      </div>

      {/* Time Filter */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-gray-700">Analysis Period:</span>
          <select 
            value={selectedTimeframe} 
            onChange={(e) => setSelectedTimeframe(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 text-sm"
          >
            <option value="7">Last 7 days</option>
            <option value="14">Last 14 days</option>
            <option value="30">Last 30 days</option>
            <option value="60">Last 60 days</option>
            <option value="90">Last 90 days</option>
          </select>
          <span className="text-sm text-gray-500">
            Analyzing {impactMetrics.totalUpdates} updates
          </span>
        </div>
      </div>

      {/* Impact Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-100">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Business Impact Score</p>
              <p className="text-2xl font-bold text-gray-900">{businessImpactScore}%</p>
              <p className="text-xs text-gray-500">Based on significance ratio</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-orange-100">
              <Zap className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Compliance Burden</p>
              <p className="text-2xl font-bold text-gray-900">{complianceBurden}</p>
              <p className="text-xs text-gray-500">Average sector relevance</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">High Impact Updates</p>
              <p className="text-2xl font-bold text-gray-900">{impactMetrics.highImpactCount || 0}</p>
              <p className="text-xs text-gray-500">Significant impact level</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Activity</p>
              <p className="text-2xl font-bold text-gray-900">{impactMetrics.totalUpdates || 0}</p>
              <p className="text-xs text-gray-500">All regulatory updates</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Impact Level Distribution */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Impact Level Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={impactDistributionData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({name, value}) => `${name}: ${value}`}
                >
                  {impactDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Authority Activity */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Authority Activity</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={authorityActivityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="authority" 
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  fontSize={12}
                />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sector Impact Analysis */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Sector Impact Analysis</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sectorImpactData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="sector" type="category" width={80} fontSize={11} />
                <Tooltip 
                  formatter={(value, name) => [`${value}%`, name === 'score' ? 'Relevance Score' : 'Update Count']}
                />
                <Bar dataKey="score" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Activity Timeline */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Timeline</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={impactMetrics.timelineData?.slice(-14) || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                  fontSize={10}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(date) => new Date(date).toLocaleDateString()}
                />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  name="Total Updates"
                />
                <Line 
                  type="monotone" 
                  dataKey="highImpact" 
                  stroke="#ef4444" 
                  strokeWidth={2}
                  name="High Impact"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Business Impact Assessment */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Business Impact Assessment</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Implementation Effort</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Low</span>
                  <span>{Math.round((impactMetrics.impactDistribution?.['Informational'] || 0) / (impactMetrics.totalUpdates || 1) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full" 
                    style={{width: `${(impactMetrics.impactDistribution?.['Informational'] || 0) / (impactMetrics.totalUpdates || 1) * 100}%`}}
                  ></div>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Resource Requirements</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Medium</span>
                  <span>{Math.round((impactMetrics.impactDistribution?.['Moderate'] || 0) / (impactMetrics.totalUpdates || 1) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-orange-500 h-2 rounded-full" 
                    style={{width: `${(impactMetrics.impactDistribution?.['Moderate'] || 0) / (impactMetrics.totalUpdates || 1) * 100}%`}}
                  ></div>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Strategic Priority</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>High</span>
                  <span>{Math.round((impactMetrics.impactDistribution?.['Significant'] || 0) / (impactMetrics.totalUpdates || 1) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-red-500 h-2 rounded-full" 
                    style={{width: `${(impactMetrics.impactDistribution?.['Significant'] || 0) / (impactMetrics.totalUpdates || 1) * 100}%`}}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImpactVisualizer;