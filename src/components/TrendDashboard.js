import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from 'recharts';
import { TrendingUp, TrendingDown, Activity, Zap, Calendar, AlertCircle, Target, Gauge } from 'lucide-react';

const TrendDashboard = () => {
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('30');
  const [trendAnalysis, setTrendAnalysis] = useState({});

  useEffect(() => {
    fetchTrendData();
  }, [selectedPeriod]);

  const fetchTrendData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/updates?limit=200&enhanced=true');
      const data = await response.json();
      setUpdates(data || []);
      calculateTrendAnalysis(data || []);
    } catch (error) {
      console.error('Failed to fetch trend data:', error);
      setUpdates([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateTrendAnalysis = (allUpdates) => {
    const days = parseInt(selectedPeriod);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const filteredUpdates = allUpdates.filter(update => 
      new Date(update.fetched_date) >= cutoffDate
    );

    // Weekly activity trends
    const weeklyData = generateWeeklyData(filteredUpdates);
    
    // Authority momentum
    const authorityMomentum = calculateAuthorityMomentum(filteredUpdates);
    
    // Sector trends
    const sectorTrends = calculateSectorTrends(filteredUpdates);
    
    // Urgency patterns
    const urgencyPatterns = calculateUrgencyPatterns(filteredUpdates);
    
    // Impact velocity (rate of significant updates)
    const impactVelocity = calculateImpactVelocity(filteredUpdates);
    
    // Regulatory pressure index
    const pressureIndex = calculateRegulatoryPressure(filteredUpdates);

    setTrendAnalysis({
      weeklyData,
      authorityMomentum,
      sectorTrends,
      urgencyPatterns,
      impactVelocity,
      pressureIndex,
      totalUpdates: filteredUpdates.length
    });
  };

  const generateWeeklyData = (updates) => {
    const weeks = {};
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(selectedPeriod));

    // Initialize weeks
    for (let i = 0; i < Math.ceil(parseInt(selectedPeriod) / 7); i++) {
      const weekStart = new Date(startDate);
      weekStart.setDate(startDate.getDate() + (i * 7));
      const weekKey = weekStart.toISOString().split('T')[0];
      weeks[weekKey] = {
        week: weekKey,
        total: 0,
        high: 0,
        medium: 0,
        low: 0,
        significant: 0,
        moderate: 0,
        informational: 0
      };
    }

    updates.forEach(update => {
      const updateDate = new Date(update.fetched_date);
      const weekStart = new Date(updateDate);
      weekStart.setDate(updateDate.getDate() - updateDate.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];

      if (weeks[weekKey]) {
        weeks[weekKey].total++;
        
        const urgency = update.urgency?.toLowerCase() || 'low';
        weeks[weekKey][urgency]++;
        
        const impact = update.impact_level?.toLowerCase() || 'informational';
        weeks[weekKey][impact]++;
      }
    });

    return Object.values(weeks).sort((a, b) => a.week.localeCompare(b.week));
  };

  const calculateAuthorityMomentum = (updates) => {
    const authorities = {};
    const midPoint = Math.floor(updates.length / 2);
    
    updates.forEach((update, index) => {
      const authority = update.authority || 'Unknown';
      if (!authorities[authority]) {
        authorities[authority] = { early: 0, recent: 0, total: 0 };
      }
      
      authorities[authority].total++;
      if (index < midPoint) {
        authorities[authority].early++;
      } else {
        authorities[authority].recent++;
      }
    });

    return Object.entries(authorities).map(([authority, data]) => {
      const momentum = data.recent - data.early;
      const trend = momentum > 0 ? 'increasing' : momentum < 0 ? 'decreasing' : 'stable';
      
      return {
        authority: authority.replace('Financial Conduct Authority', 'FCA')
                          .replace('Prudential Regulation Authority', 'PRA')
                          .replace('Bank of England', 'BoE'),
        momentum: Math.abs(momentum),
        trend,
        total: data.total,
        changeRate: data.early > 0 ? ((data.recent - data.early) / data.early * 100) : 0
      };
    }).sort((a, b) => b.total - a.total).slice(0, 6);
  };

  const calculateSectorTrends = (updates) => {
    const sectorActivity = {};
    
    updates.forEach(update => {
      if (update.sector_relevance_scores) {
        Object.entries(update.sector_relevance_scores).forEach(([sector, score]) => {
          if (score > 30) { // Only meaningful relevance
            if (!sectorActivity[sector]) {
              sectorActivity[sector] = { count: 0, totalScore: 0, trend: 0 };
            }
            sectorActivity[sector].count++;
            sectorActivity[sector].totalScore += score;
          }
        });
      }
    });

    return Object.entries(sectorActivity)
      .map(([sector, data]) => ({
        sector: sector.replace(' Management', '').replace(' Markets', ''),
        activity: data.count,
        avgRelevance: Math.round(data.totalScore / data.count),
        intensity: Math.min(100, (data.count * data.totalScore / data.count) / 10)
      }))
      .sort((a, b) => b.intensity - a.intensity)
      .slice(0, 8);
  };

  const calculateUrgencyPatterns = (updates) => {
    const patterns = { High: 0, Medium: 0, Low: 0 };
    
    updates.forEach(update => {
      const urgency = update.urgency || 'Low';
      patterns[urgency]++;
    });

    const total = Object.values(patterns).reduce((sum, count) => sum + count, 0);
    
    return Object.entries(patterns).map(([level, count]) => ({
      level,
      count,
      percentage: Math.round((count / total) * 100)
    }));
  };

  const calculateImpactVelocity = (updates) => {
    const significantUpdates = updates.filter(u => u.impact_level === 'Significant');
    const days = parseInt(selectedPeriod);
    return Math.round((significantUpdates.length / days) * 7); // Per week
  };

  const calculateRegulatoryPressure = (updates) => {
    const weights = { 'Significant': 3, 'Moderate': 2, 'Informational': 1 };
    const urgencyWeights = { 'High': 3, 'Medium': 2, 'Low': 1 };
    
    const totalPressure = updates.reduce((sum, update) => {
      const impactWeight = weights[update.impact_level] || 1;
      const urgencyWeight = urgencyWeights[update.urgency] || 1;
      return sum + (impactWeight * urgencyWeight);
    }, 0);

    const maxPossiblePressure = updates.length * 9; // max weights
    return Math.round((totalPressure / maxPossiblePressure) * 100);
  };

  const getTrendDirection = (value, threshold = 0) => {
    if (value > threshold) return { icon: TrendingUp, color: 'text-green-600', text: 'Increasing' };
    if (value < -threshold) return { icon: TrendingDown, color: 'text-red-600', text: 'Decreasing' };
    return { icon: Activity, color: 'text-gray-600', text: 'Stable' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Analyzing regulatory trends...</span>
      </div>
    );
  }

  const { weeklyData, authorityMomentum, sectorTrends, urgencyPatterns, impactVelocity, pressureIndex } = trendAnalysis;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-6 rounded-lg">
        <h1 className="text-2xl font-bold flex items-center">
          <Activity className="mr-3" />
          Regulatory Trend Dashboard
        </h1>
        <p className="text-green-100 mt-1">
          Pattern recognition and momentum analysis for regulatory activity
        </p>
      </div>

      {/* Period Selector */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-gray-700">Analysis Period:</span>
          <select 
            value={selectedPeriod} 
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 text-sm"
          >
            <option value="14">Last 2 weeks</option>
            <option value="30">Last 30 days</option>
            <option value="60">Last 60 days</option>
            <option value="90">Last 90 days</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100">
              <Zap className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Impact Velocity</p>
              <p className="text-2xl font-bold text-gray-900">{impactVelocity}/week</p>
              <p className="text-xs text-gray-500">Significant updates</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100">
              <Gauge className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Pressure Index</p>
              <p className="text-2xl font-bold text-gray-900">{pressureIndex}%</p>
              <p className="text-xs text-gray-500">Regulatory intensity</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100">
              <Target className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Active Authorities</p>
              <p className="text-2xl font-bold text-gray-900">{authorityMomentum?.length || 0}</p>
              <p className="text-xs text-gray-500">Publishing updates</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-orange-100">
              <Calendar className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Activity</p>
              <p className="text-2xl font-bold text-gray-900">{trendAnalysis.totalUpdates || 0}</p>
              <p className="text-xs text-gray-500">Updates tracked</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Activity Trend */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Activity Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="week" 
                  tickFormatter={(date) => new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                  fontSize={10}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(date) => `Week of ${new Date(date).toLocaleDateString()}`}
                />
                <Area 
                  type="monotone" 
                  dataKey="total" 
                  stroke="#3b82f6" 
                  fill="#3b82f6" 
                  fillOpacity={0.3}
                  name="Total Updates"
                />
                <Area 
                  type="monotone" 
                  dataKey="significant" 
                  stroke="#ef4444" 
                  fill="#ef4444" 
                  fillOpacity={0.5}
                  name="Significant Impact"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Authority Momentum */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Authority Momentum</h3>
          <div className="space-y-3">
            {authorityMomentum?.slice(0, 6).map((authority, idx) => {
              const trendInfo = getTrendDirection(authority.changeRate, 10);
              const TrendIcon = trendInfo.icon;
              
              return (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mr-3"></div>
                    <div>
                      <p className="font-medium text-gray-900">{authority.authority}</p>
                      <p className="text-sm text-gray-500">{authority.total} updates</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <TrendIcon className={`w-4 h-4 ${trendInfo.color} mr-1`} />
                    <span className={`text-sm ${trendInfo.color}`}>
                      {Math.round(Math.abs(authority.changeRate))}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sector Activity Intensity */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Sector Activity Intensity</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sectorTrends} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="sector" type="category" width={80} fontSize={11} />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'intensity' ? `${value}% intensity` : `${value} updates`,
                    name === 'intensity' ? 'Activity Intensity' : 'Update Count'
                  ]}
                />
                <Bar dataKey="intensity" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Urgency Distribution Pattern */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Urgency Distribution</h3>
          <div className="space-y-4">
            {urgencyPatterns?.map((pattern, idx) => {
              const colors = {
                'High': 'bg-red-500',
                'Medium': 'bg-orange-500', 
                'Low': 'bg-green-500'
              };
              
              return (
                <div key={idx}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">{pattern.level} Urgency</span>
                    <span className="text-sm text-gray-500">{pattern.count} updates ({pattern.percentage}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${colors[pattern.level]}`}
                      style={{ width: `${pattern.percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="mt-6 p-4 bg-gray-50 rounded">
            <h4 className="font-medium text-gray-900 mb-2">Pattern Insights</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p>• Current regulatory pressure: <span className="font-semibold">{pressureIndex}%</span></p>
              <p>• High-impact velocity: <span className="font-semibold">{impactVelocity} updates/week</span></p>
              <p>• Most active: <span className="font-semibold">{authorityMomentum?.[0]?.authority || 'N/A'}</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* Trend Summary */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Trend Analysis Summary</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                <TrendingUp className="w-4 h-4 mr-2 text-green-600" />
                Increasing Activity
              </h4>
              <div className="space-y-2">
                {authorityMomentum?.filter(a => a.trend === 'increasing').slice(0, 3).map((authority, idx) => (
                  <div key={idx} className="text-sm text-gray-600">
                    • {authority.authority} (+{Math.round(authority.changeRate)}%)
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                <Target className="w-4 h-4 mr-2 text-blue-600" />
                Top Focus Areas
              </h4>
              <div className="space-y-2">
                {sectorTrends?.slice(0, 3).map((sector, idx) => (
                  <div key={idx} className="text-sm text-gray-600">
                    • {sector.sector} ({sector.activity} updates)
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                <AlertCircle className="w-4 h-4 mr-2 text-orange-600" />
                Key Indicators
              </h4>
              <div className="space-y-2 text-sm text-gray-600">
                <div>• Pressure Index: {pressureIndex}%</div>
                <div>• Impact Velocity: {impactVelocity}/week</div>
                <div>• Active Authorities: {authorityMomentum?.length || 0}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrendDashboard;