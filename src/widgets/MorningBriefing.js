import React, { useState, useEffect } from 'react';
import { Coffee, Sun, TrendingUp, AlertTriangle, Clock, Target, BarChart3, Users, Calendar } from 'lucide-react';

const MorningBriefing = () => {
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [briefingData, setBriefingData] = useState({});
  const [briefingDate, setBriefingDate] = useState(new Date());

  useEffect(() => {
    fetchBriefingData();
  }, []);

  const fetchBriefingData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/updates?limit=100&enhanced=true');
      const data = await response.json();
      setUpdates(data || []);
      generateMorningBriefing(data || []);
    } catch (error) {
      console.error('Failed to fetch briefing data:', error);
      setUpdates([]);
    } finally {
      setLoading(false);
    }
  };

  const generateMorningBriefing = (allUpdates) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const last24Hours = new Date(today);
    last24Hours.setHours(today.getHours() - 24);
    const last7Days = new Date(today);
    last7Days.setDate(today.getDate() - 7);

    // Filter updates for different time periods
    const todayUpdates = allUpdates.filter(update => 
      new Date(update.fetched_date).toDateString() === today.toDateString()
    );
    const yesterdayUpdates = allUpdates.filter(update => 
      new Date(update.fetched_date).toDateString() === yesterday.toDateString()
    );
    const last24HourUpdates = allUpdates.filter(update => 
      new Date(update.fetched_date) >= last24Hours
    );
    const weeklyUpdates = allUpdates.filter(update => 
      new Date(update.fetched_date) >= last7Days
    );

    const briefing = {
      executiveSummary: generateExecutiveSummary(last24HourUpdates, weeklyUpdates),
      keyHighlights: generateKeyHighlights(last24HourUpdates),
      priorityActions: generatePriorityActions(last24HourUpdates),
      marketIntelligence: generateMarketIntelligence(weeklyUpdates),
      upcomingEvents: generateUpcomingEvents(allUpdates),
      riskAlerts: generateRiskAlerts(last24HourUpdates),
      sectorWatch: generateSectorWatch(weeklyUpdates),
      authorityActivity: generateAuthorityActivity(last24HourUpdates),
      weeklyTrends: generateWeeklyTrends(weeklyUpdates),
      actionableInsights: generateActionableInsights(last24HourUpdates, weeklyUpdates),
      todayStats: {
        totalToday: todayUpdates.length,
        totalYesterday: yesterdayUpdates.length,
        totalLast24h: last24HourUpdates.length,
        highImpact24h: last24HourUpdates.filter(u => u.impact_level === 'Significant').length,
        urgent24h: last24HourUpdates.filter(u => u.urgency === 'High').length
      }
    };

    setBriefingData(briefing);
  };

  const generateExecutiveSummary = (last24h, weekly) => {
    const totalActivity = last24h.length;
    const highImpact = last24h.filter(u => u.impact_level === 'Significant').length;
    const weeklyAvg = Math.round(weekly.length / 7);
    
    const activityLevel = totalActivity > weeklyAvg * 1.5 ? 'elevated' : 
                         totalActivity < weeklyAvg * 0.5 ? 'reduced' : 'normal';
    
    const topAuthority = getTopAuthority(last24h);
    const emergingThemes = getEmergingThemes(last24h);

    return {
      activityLevel,
      totalActivity,
      highImpact,
      weeklyAvg,
      topAuthority,
      emergingThemes: emergingThemes.slice(0, 3),
      summary: `${activityLevel.charAt(0).toUpperCase() + activityLevel.slice(1)} regulatory activity with ${totalActivity} updates in the last 24 hours. ${highImpact} high-impact items require attention.`
    };
  };

  const generateKeyHighlights = (updates) => {
    return updates
      .filter(update => update.impact_level === 'Significant' || update.urgency === 'High')
      .sort((a, b) => {
        const aScore = (a.impact_level === 'Significant' ? 3 : 0) + (a.urgency === 'High' ? 2 : 0);
        const bScore = (b.impact_level === 'Significant' ? 3 : 0) + (b.urgency === 'High' ? 2 : 0);
        return bScore - aScore;
      })
      .slice(0, 5)
      .map(update => ({
        headline: update.headline,
        impact: update.impact,
        authority: update.authority,
        urgency: update.urgency,
        impactLevel: update.impact_level,
        keyImplication: extractKeyImplication(update),
        timeToAction: getTimeToAction(update)
      }));
  };

  const generatePriorityActions = (updates) => {
    const actions = [];
    
    updates.forEach(update => {
      if (update.urgency === 'High' || update.impact_level === 'Significant') {
        const action = {
          title: extractActionTitle(update),
          description: update.impact,
          deadline: extractDeadline(update),
          priority: getPriority(update),
          authority: update.authority,
          type: getActionType(update)
        };
        actions.push(action);
      }
    });

    return actions.slice(0, 6);
  };

  const generateMarketIntelligence = (weekly) => {
    const sectorActivity = {};
    const impactTrends = { increasing: 0, stable: 0, decreasing: 0 };
    
    weekly.forEach(update => {
      if (update.sector_relevance_scores) {
        Object.entries(update.sector_relevance_scores).forEach(([sector, score]) => {
          if (score > 30) {
            sectorActivity[sector] = (sectorActivity[sector] || 0) + 1;
          }
        });
      }
    });

    const topSectors = Object.entries(sectorActivity)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([sector, count]) => ({ sector, count }));

    return {
      topSectors,
      totalWeeklyUpdates: weekly.length,
      avgDailyUpdates: Math.round(weekly.length / 7),
      impactDistribution: calculateImpactDistribution(weekly),
      keyInsight: generateMarketInsight(topSectors, weekly)
    };
  };

  const generateUpcomingEvents = (allUpdates) => {
    const events = [];
    const today = new Date();
    const next30Days = new Date(today);
    next30Days.setDate(today.getDate() + 30);

    allUpdates.forEach(update => {
      const deadlines = extractDeadlines(update);
      deadlines.forEach(deadline => {
        if (deadline.date >= today && deadline.date <= next30Days) {
          events.push({
            date: deadline.date,
            title: deadline.title,
            type: deadline.type,
            authority: update.authority,
            daysUntil: Math.ceil((deadline.date - today) / (1000 * 60 * 60 * 24))
          });
        }
      });
    });

    return events.sort((a, b) => a.date - b.date).slice(0, 8);
  };

  const generateRiskAlerts = (updates) => {
    const alerts = [];
    
    updates.forEach(update => {
      const riskScore = calculateRiskScore(update);
      if (riskScore >= 7) {
        alerts.push({
          title: update.headline,
          description: update.impact,
          riskScore,
          riskType: getRiskType(update),
          authority: update.authority,
          mitigation: generateMitigation(update)
        });
      }
    });

    return alerts.sort((a, b) => b.riskScore - a.riskScore).slice(0, 4);
  };

  const generateSectorWatch = (weekly) => {
    const sectorData = {};
    
    weekly.forEach(update => {
      if (update.sector_relevance_scores) {
        Object.entries(update.sector_relevance_scores).forEach(([sector, score]) => {
          if (score > 25) {
            if (!sectorData[sector]) {
              sectorData[sector] = { updates: 0, totalScore: 0, highImpact: 0 };
            }
            sectorData[sector].updates++;
            sectorData[sector].totalScore += score;
            if (update.impact_level === 'Significant') {
              sectorData[sector].highImpact++;
            }
          }
        });
      }
    });

    return Object.entries(sectorData)
      .map(([sector, data]) => ({
        sector,
        updates: data.updates,
        avgRelevance: Math.round(data.totalScore / data.updates),
        highImpact: data.highImpact,
        intensity: calculateSectorIntensity(data)
      }))
      .sort((a, b) => b.intensity - a.intensity)
      .slice(0, 6);
  };

  const generateAuthorityActivity = (updates) => {
    const activity = {};
    
    updates.forEach(update => {
      const authority = update.authority || 'Unknown';
      if (!activity[authority]) {
        activity[authority] = { updates: 0, highImpact: 0 };
      }
      activity[authority].updates++;
      if (update.impact_level === 'Significant') {
        activity[authority].highImpact++;
      }
    });

    return Object.entries(activity)
      .map(([authority, data]) => ({
        authority: authority.replace('Financial Conduct Authority', 'FCA')
                          .replace('Prudential Regulation Authority', 'PRA')
                          .replace('Bank of England', 'BoE'),
        ...data
      }))
      .sort((a, b) => b.updates - a.updates)
      .slice(0, 5);
  };

  const generateWeeklyTrends = (weekly) => {
    const trends = {
      volumeTrend: calculateVolumeTrend(weekly),
      impactTrend: calculateImpactTrend(weekly),
      urgencyTrend: calculateUrgencyTrend(weekly),
      thematicTrends: getThematicTrends(weekly)
    };
    
    return trends;
  };

  const generateActionableInsights = (last24h, weekly) => {
    const insights = [];
    
    // Insight 1: Activity patterns
    const todayActivity = last24h.length;
    const weeklyAvg = weekly.length / 7;
    if (todayActivity > weeklyAvg * 1.5) {
      insights.push({
        type: 'Activity Alert',
        insight: `Elevated regulatory activity today (${todayActivity} vs ${Math.round(weeklyAvg)} daily average)`,
        action: 'Monitor for emerging regulatory themes and prepare compliance team'
      });
    }

    // Insight 2: High impact concentration
    const highImpact = last24h.filter(u => u.impact_level === 'Significant').length;
    if (highImpact > 2) {
      insights.push({
        type: 'Impact Focus',
        insight: `${highImpact} significant impact updates in 24 hours`,
        action: 'Prioritize review of high-impact items for immediate action'
      });
    }

    // Insight 3: Sector concentration
    const topSector = getTopSectorActivity(last24h);
    if (topSector && topSector.count > 2) {
      insights.push({
        type: 'Sector Alert',
        insight: `Increased activity in ${topSector.sector} (${topSector.count} updates)`,
        action: `Review ${topSector.sector} compliance requirements and readiness`
      });
    }

    return insights.slice(0, 4);
  };

  // Helper functions
  const getTopAuthority = (updates) => {
    const counts = {};
    updates.forEach(update => {
      const auth = update.authority || 'Unknown';
      counts[auth] = (counts[auth] || 0) + 1;
    });
    const top = Object.entries(counts).sort(([,a], [,b]) => b - a)[0];
    return top ? { name: top[0], count: top[1] } : null;
  };

  const getEmergingThemes = (updates) => {
    const themes = {};
    updates.forEach(update => {
      const text = `${update.headline} ${update.impact}`.toLowerCase();
      const themeKeywords = {
        'Digital Assets': ['crypto', 'digital asset', 'blockchain'],
        'ESG': ['esg', 'sustainability', 'climate'],
        'Consumer Protection': ['consumer', 'protection', 'vulnerable'],
        'Operational Resilience': ['operational', 'resilience', 'outsourcing'],
        'Market Conduct': ['market conduct', 'market abuse', 'integrity']
      };
      
      Object.entries(themeKeywords).forEach(([theme, keywords]) => {
        if (keywords.some(keyword => text.includes(keyword))) {
          themes[theme] = (themes[theme] || 0) + 1;
        }
      });
    });
    
    return Object.entries(themes).sort(([,a], [,b]) => b - a).map(([theme]) => theme);
  };

  const extractKeyImplication = (update) => {
    const impact = update.impact || '';
    if (impact.length > 100) {
      return impact.substring(0, 100) + '...';
    }
    return impact;
  };

  const getTimeToAction = (update) => {
    if (update.urgency === 'High') return 'Immediate';
    if (update.impact_level === 'Significant') return 'This Week';
    return 'Monitor';
  };

  const extractActionTitle = (update) => {
    const headline = update.headline.toLowerCase();
    if (headline.includes('consultation')) return 'Review consultation document';
    if (headline.includes('guidance')) return 'Implement new guidance';
    if (headline.includes('deadline')) return 'Meet compliance deadline';
    return 'Review and assess impact';
  };

  const extractDeadline = (update) => {
    const text = `${update.headline} ${update.key_dates || ''}`;
    const datePattern = /(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})/gi;
    const match = text.match(datePattern);
    return match ? match[0] : null;
  };

  const getPriority = (update) => {
    if (update.urgency === 'High' && update.impact_level === 'Significant') return 'Critical';
    if (update.urgency === 'High' || update.impact_level === 'Significant') return 'High';
    return 'Medium';
  };

  const getActionType = (update) => {
    const headline = update.headline.toLowerCase();
    if (headline.includes('consultation')) return 'Response Required';
    if (headline.includes('implementation')) return 'Implementation';
    if (headline.includes('reporting')) return 'Reporting';
    return 'Review';
  };

  const extractDeadlines = (update) => {
    // Simplified deadline extraction
    const deadlines = [];
    const datePattern = /(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})/gi;
    const text = `${update.headline} ${update.key_dates || ''}`;
    let match;
    
    while ((match = datePattern.exec(text)) !== null) {
      const date = new Date(match[0]);
      if (date > new Date()) {
        deadlines.push({
          date,
          title: `Deadline: ${update.headline}`,
          type: 'Compliance'
        });
      }
    }
    
    return deadlines;
  };

  const calculateRiskScore = (update) => {
    let score = 0;
    if (update.urgency === 'High') score += 3;
    else if (update.urgency === 'Medium') score += 2;
    else score += 1;
    
    if (update.impact_level === 'Significant') score += 4;
    else if (update.impact_level === 'Moderate') score += 2;
    else score += 1;
    
    return score;
  };

  const getRiskType = (update) => {
    const text = `${update.headline} ${update.impact}`.toLowerCase();
    if (text.includes('enforcement') || text.includes('penalty')) return 'Enforcement Risk';
    if (text.includes('compliance')) return 'Compliance Risk';
    if (text.includes('operational')) return 'Operational Risk';
    return 'Regulatory Risk';
  };

  const generateMitigation = (update) => {
    const type = getRiskType(update);
    const mitigations = {
      'Enforcement Risk': 'Review compliance procedures and ensure documentation',
      'Compliance Risk': 'Assess current compliance status and identify gaps',
      'Operational Risk': 'Evaluate operational procedures and controls',
      'Regulatory Risk': 'Monitor developments and prepare response plan'
    };
    return mitigations[type] || 'Assess impact and develop response strategy';
  };

  const calculateImpactDistribution = (updates) => {
    const dist = { Significant: 0, Moderate: 0, Informational: 0 };
    updates.forEach(update => {
      const level = update.impact_level || 'Informational';
      dist[level]++;
    });
    return dist;
  };

  const generateMarketInsight = (topSectors, weekly) => {
    if (topSectors.length === 0) return 'Limited regulatory activity this week';
    const topSector = topSectors[0];
    const totalUpdates = weekly.length;
    const percentage = Math.round((topSector.count / totalUpdates) * 100);
    return `${topSector.sector} sector shows highest activity (${percentage}% of weekly updates)`;
  };

  const calculateSectorIntensity = (data) => {
    return (data.updates * data.avgRelevance / 100) + (data.highImpact * 2);
  };

  const calculateVolumeTrend = (weekly) => {
    // Simplified trend calculation
    const firstHalf = weekly.slice(0, Math.floor(weekly.length / 2));
    const secondHalf = weekly.slice(Math.floor(weekly.length / 2));
    if (secondHalf.length > firstHalf.length) return 'Increasing';
    if (secondHalf.length < firstHalf.length) return 'Decreasing';
    return 'Stable';
  };

  const calculateImpactTrend = (weekly) => {
    const significant = weekly.filter(u => u.impact_level === 'Significant').length;
    const total = weekly.length;
    const ratio = total > 0 ? significant / total : 0;
    if (ratio > 0.3) return 'High Impact Week';
    if (ratio > 0.15) return 'Moderate Impact';
    return 'Standard Impact';
  };

  const calculateUrgencyTrend = (weekly) => {
    const urgent = weekly.filter(u => u.urgency === 'High').length;
    if (urgent > 5) return 'High Urgency';
    if (urgent > 2) return 'Moderate Urgency';
    return 'Standard Urgency';
  };

  const getThematicTrends = (weekly) => {
    return getEmergingThemes(weekly).slice(0, 3);
  };

  const getTopSectorActivity = (updates) => {
    const sectors = {};
    updates.forEach(update => {
      if (update.sector_relevance_scores) {
        Object.entries(update.sector_relevance_scores).forEach(([sector, score]) => {
          if (score > 30) {
            sectors[sector] = (sectors[sector] || 0) + 1;
          }
        });
      }
    });
    const top = Object.entries(sectors).sort(([,a], [,b]) => b - a)[0];
    return top ? { sector: top[0], count: top[1] } : null;
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-GB', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Critical': return 'text-red-700 bg-red-100 border-red-300';
      case 'High': return 'text-orange-700 bg-orange-100 border-orange-300';
      case 'Medium': return 'text-yellow-700 bg-yellow-100 border-yellow-300';
      default: return 'text-gray-700 bg-gray-100 border-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Preparing your morning briefing...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white p-6 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center">
              <Coffee className="mr-3" />
              Morning Regulatory Briefing
            </h1>
            <p className="text-amber-100 mt-1">
              {formatDate(briefingDate)} • Your daily regulatory intelligence summary
            </p>
          </div>
          <div className="text-right">
            <Sun className="w-8 h-8 mb-2" />
            <div className="text-amber-100 text-sm">
              {new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>
      </div>

      {/* Executive Summary */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <BarChart3 className="w-5 h-5 mr-2" />
          Executive Summary
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-4 bg-blue-50 rounded">
            <div className="text-2xl font-bold text-blue-900">{briefingData.todayStats?.totalLast24h || 0}</div>
            <div className="text-sm text-blue-600">Updates (24h)</div>
          </div>
          <div className="text-center p-4 bg-red-50 rounded">
            <div className="text-2xl font-bold text-red-900">{briefingData.todayStats?.highImpact24h || 0}</div>
            <div className="text-sm text-red-600">High Impact</div>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded">
            <div className="text-2xl font-bold text-orange-900">{briefingData.todayStats?.urgent24h || 0}</div>
            <div className="text-sm text-orange-600">Urgent Items</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded">
            <div className="text-2xl font-bold text-green-900 capitalize">
              {briefingData.executiveSummary?.activityLevel || 'Normal'}
            </div>
            <div className="text-sm text-green-600">Activity Level</div>
          </div>
        </div>

        <p className="text-gray-700 mb-4">{briefingData.executiveSummary?.summary}</p>
        
        {briefingData.executiveSummary?.emergingThemes?.length > 0 && (
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Emerging Themes:</h3>
            <div className="flex flex-wrap gap-2">
              {briefingData.executiveSummary.emergingThemes.map((theme, idx) => (
                <span key={idx} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                  {theme}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Key Highlights & Priority Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Key Highlights */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            Key Highlights
          </h2>
          <div className="space-y-4">
            {briefingData.keyHighlights?.slice(0, 4).map((highlight, idx) => (
              <div key={idx} className="border-l-4 border-blue-400 pl-4">
                <h3 className="font-medium text-gray-900">{highlight.headline}</h3>
                <p className="text-sm text-gray-600 mt-1">{highlight.keyImplication}</p>
                <div className="flex items-center mt-2 space-x-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium border ${
                    highlight.priority === 'Critical' ? 'text-red-700 bg-red-100 border-red-300' :
                    highlight.priority === 'High' ? 'text-orange-700 bg-orange-100 border-orange-300' :
                    'text-yellow-700 bg-yellow-100 border-yellow-300'
                  }`}>
                    {highlight.urgency}
                  </span>
                  <span className="text-xs text-gray-500">{highlight.authority}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Priority Actions */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Target className="w-5 h-5 mr-2" />
            Priority Actions
          </h2>
          <div className="space-y-4">
            {briefingData.priorityActions?.slice(0, 4).map((action, idx) => (
              <div key={idx} className="p-3 bg-gray-50 rounded">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{action.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{action.description}</p>
                    {action.deadline && (
                      <div className="flex items-center mt-2 text-xs text-red-600">
                        <Clock className="w-3 h-3 mr-1" />
                        <span>Deadline: {action.deadline}</span>
                      </div>
                    )}
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium border ${getPriorityColor(action.priority)}`}>
                    {action.priority}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Risk Alerts & Upcoming Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Alerts */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-red-500" />
            Risk Alerts
          </h2>
          {briefingData.riskAlerts?.length > 0 ? (
            <div className="space-y-4">
              {briefingData.riskAlerts.slice(0, 3).map((alert, idx) => (
                <div key={idx} className="border border-red-200 rounded p-3 bg-red-50">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-gray-900">{alert.title}</h3>
                    <span className="px-2 py-1 bg-red-200 text-red-800 rounded text-xs font-medium">
                      Risk: {alert.riskScore}/9
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{alert.description}</p>
                  <div className="text-xs text-gray-700">
                    <strong>Mitigation:</strong> {alert.mitigation}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No significant risk alerts today</p>
          )}
        </div>

        {/* Upcoming Events */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Upcoming Events
          </h2>
          {briefingData.upcomingEvents?.length > 0 ? (
            <div className="space-y-3">
              {briefingData.upcomingEvents.slice(0, 5).map((event, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                  <div>
                    <h3 className="font-medium text-gray-900">{event.title}</h3>
                    <p className="text-sm text-gray-500">{event.authority}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {event.daysUntil === 0 ? 'Today' : 
                       event.daysUntil === 1 ? 'Tomorrow' : 
                       `${event.daysUntil} days`}
                    </div>
                    <div className="text-xs text-gray-500">
                      {event.date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No upcoming deadlines in the next 30 days</p>
          )}
        </div>
      </div>

      {/* Market Intelligence & Authority Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sector Watch */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Sector Watch</h2>
          {briefingData.sectorWatch?.length > 0 ? (
            <div className="space-y-3">
              {briefingData.sectorWatch.slice(0, 5).map((sector, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">{sector.sector}</div>
                    <div className="text-sm text-gray-500">
                      {sector.updates} updates • {sector.highImpact} high impact
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {sector.avgRelevance}% relevance
                    </div>
                    <div className="w-16 bg-gray-200 rounded-full h-1">
                      <div 
                        className="bg-blue-500 h-1 rounded-full" 
                        style={{ width: `${Math.min(100, sector.intensity * 2)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No significant sector activity to report</p>
          )}
        </div>

        {/* Authority Activity */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Users className="w-5 h-5 mr-2" />
            Authority Activity (24h)
          </h2>
          {briefingData.authorityActivity?.length > 0 ? (
            <div className="space-y-3">
              {briefingData.authorityActivity.map((authority, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="font-medium text-gray-900">{authority.authority}</div>
                  <div className="text-right">
                    <div className="text-sm text-gray-900">
                      {authority.updates} updates
                    </div>
                    {authority.highImpact > 0 && (
                      <div className="text-xs text-red-600">
                        {authority.highImpact} high impact
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No authority activity in the last 24 hours</p>
          )}
        </div>
      </div>

      {/* Actionable Insights */}
      {briefingData.actionableInsights?.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Actionable Insights</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {briefingData.actionableInsights.map((insight, idx) => (
              <div key={idx} className="p-4 border border-blue-200 rounded-lg bg-blue-50">
                <h3 className="font-medium text-blue-900 mb-2">{insight.type}</h3>
                <p className="text-sm text-blue-800 mb-2">{insight.insight}</p>
                <p className="text-sm text-blue-700 font-medium">
                  <strong>Action:</strong> {insight.action}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="bg-gray-50 rounded-lg p-4 text-center">
        <p className="text-sm text-gray-600">
          Briefing generated at {new Date().toLocaleTimeString('en-GB')} • 
          Next briefing: Tomorrow at 08:00
        </p>
      </div>
    </div>
  );
};

export default MorningBriefing;