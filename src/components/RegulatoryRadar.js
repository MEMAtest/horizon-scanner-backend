import React, { useState, useEffect } from 'react';
import { Radar, AlertTriangle, Clock, Shield, Zap, Activity, Calendar, Bell } from 'lucide-react';

const RegulatoryRadar = () => {
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [earlyWarnings, setEarlyWarnings] = useState([]);
  const [riskScore, setRiskScore] = useState(0);
  const [selectedRiskLevel, setSelectedRiskLevel] = useState('all');

  useEffect(() => {
    fetchRadarData();
  }, []);

  const fetchRadarData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/updates?limit=100&enhanced=true');
      const data = await response.json();
      setUpdates(data || []);
      analyzeEarlyWarnings(data || []);
    } catch (error) {
      console.error('Failed to fetch radar data:', error);
      setUpdates([]);
    } finally {
      setLoading(false);
    }
  };

  const analyzeEarlyWarnings = (allUpdates) => {
    // Calculate overall risk score
    const riskWeights = { 'High': 3, 'Medium': 2, 'Low': 1 };
    const impactWeights = { 'Significant': 3, 'Moderate': 2, 'Informational': 1 };
    
    let totalRiskScore = 0;
    let maxPossibleScore = 0;

    const warnings = allUpdates.map(update => {
      const urgencyWeight = riskWeights[update.urgency] || 1;
      const impactWeight = impactWeights[update.impact_level] || 1;
      const riskScore = urgencyWeight * impactWeight;
      
      totalRiskScore += riskScore;
      maxPossibleScore += 9; // max possible score per update

      return {
        ...update,
        riskScore,
        riskLevel: getRiskLevel(riskScore),
        warningType: getWarningType(update),
        timeToAction: getTimeToAction(update),
        complianceDeadline: extractDeadlines(update.key_dates || update.headline),
        businessImpact: getBusinessImpact(update)
      };
    }).filter(warning => warning.riskScore >= 4) // Only show medium-high risk items
      .sort((a, b) => b.riskScore - a.riskScore);

    setEarlyWarnings(warnings);
    setRiskScore(Math.round((totalRiskScore / maxPossibleScore) * 100));
  };

  const getRiskLevel = (score) => {
    if (score >= 7) return 'Critical';
    if (score >= 5) return 'High';
    if (score >= 3) return 'Medium';
    return 'Low';
  };

  const getWarningType = (update) => {
    const headline = update.headline?.toLowerCase() || '';
    const impact = update.impact?.toLowerCase() || '';
    
    if (headline.includes('consultation') || headline.includes('proposal')) return 'Upcoming Regulation';
    if (headline.includes('deadline') || headline.includes('implementation')) return 'Compliance Deadline';
    if (headline.includes('enforcement') || headline.includes('action')) return 'Enforcement Alert';
    if (headline.includes('guidance') || headline.includes('clarification')) return 'Regulatory Guidance';
    if (impact.includes('capital') || impact.includes('reporting')) return 'Operational Impact';
    return 'General Alert';
  };

  const getTimeToAction = (update) => {
    const keyDates = update.key_dates || '';
    const headline = update.headline || '';
    
    // Extract dates and calculate urgency
    const datePatterns = [
      /(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})/gi,
      /(\d{1,2})\/(\d{1,2})\/(\d{4})/g,
      /(\d{4})-(\d{1,2})-(\d{1,2})/g
    ];
    
    for (const pattern of datePatterns) {
      const match = (keyDates + ' ' + headline).match(pattern);
      if (match) {
        const foundDate = new Date(match[0]);
        const now = new Date();
        const daysDiff = Math.ceil((foundDate - now) / (1000 * 60 * 60 * 24));
        
        if (daysDiff > 0) {
          if (daysDiff <= 7) return 'Immediate';
          if (daysDiff <= 30) return 'This Month';
          if (daysDiff <= 90) return 'This Quarter';
          return 'Future';
        }
      }
    }
    
    // Fallback based on urgency
    switch (update.urgency) {
      case 'High': return 'Immediate';
      case 'Medium': return 'This Month';
      default: return 'Monitor';
    }
  };

  const extractDeadlines = (text) => {
    if (!text) return null;
    
    const deadlineKeywords = ['deadline', 'due', 'implementation', 'effective', 'commence'];
    const lowerText = text.toLowerCase();
    
    if (deadlineKeywords.some(keyword => lowerText.includes(keyword))) {
      const datePatterns = [
        /(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})/gi,
        /(\d{1,2})\/(\d{1,2})\/(\d{4})/g
      ];
      
      for (const pattern of datePatterns) {
        const match = text.match(pattern);
        if (match) return match[0];
      }
    }
    
    return null;
  };

  const getBusinessImpact = (update) => {
    const impact = update.impact?.toLowerCase() || '';
    const headline = update.headline?.toLowerCase() || '';
    
    if (impact.includes('capital') || headline.includes('capital')) return 'Capital Requirements';
    if (impact.includes('reporting') || headline.includes('reporting')) return 'Reporting Obligations';
    if (impact.includes('compliance') || headline.includes('compliance')) return 'Compliance Procedures';
    if (impact.includes('operational') || headline.includes('operational')) return 'Operational Changes';
    if (impact.includes('risk') || headline.includes('risk')) return 'Risk Management';
    return 'Business Operations';
  };

  const getRiskLevelColor = (level) => {
    switch (level) {
      case 'Critical': return 'text-red-700 bg-red-100 border-red-300';
      case 'High': return 'text-red-600 bg-red-50 border-red-200';
      case 'Medium': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'Low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getWarningTypeIcon = (type) => {
    switch (type) {
      case 'Upcoming Regulation': return Calendar;
      case 'Compliance Deadline': return Clock;
      case 'Enforcement Alert': return Shield;
      case 'Regulatory Guidance': return Activity;
      case 'Operational Impact': return Zap;
      default: return Bell;
    }
  };

  const getFilteredWarnings = () => {
    if (selectedRiskLevel === 'all') return earlyWarnings;
    return earlyWarnings.filter(warning => warning.riskLevel === selectedRiskLevel);
  };

  const getRadarStats = () => {
    const critical = earlyWarnings.filter(w => w.riskLevel === 'Critical').length;
    const immediate = earlyWarnings.filter(w => w.timeToAction === 'Immediate').length;
    const withDeadlines = earlyWarnings.filter(w => w.complianceDeadline).length;
    
    return { critical, immediate, withDeadlines };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Scanning regulatory radar...</span>
      </div>
    );
  }

  const filteredWarnings = getFilteredWarnings();
  const stats = getRadarStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white p-6 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center">
              <Radar className="mr-3" />
              Regulatory Radar
            </h1>
            <p className="text-red-100 mt-1">
              Early warning system for regulatory risks and compliance deadlines
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{riskScore}%</div>
            <div className="text-red-100 text-sm">Risk Level</div>
          </div>
        </div>
      </div>

      {/* Risk Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center">
            <AlertTriangle className="w-8 h-8 text-red-500" />
            <div className="ml-3">
              <p className="text-sm text-gray-600">Critical Alerts</p>
              <p className="text-2xl font-bold text-gray-900">{stats.critical}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center">
            <Clock className="w-8 h-8 text-orange-500" />
            <div className="ml-3">
              <p className="text-sm text-gray-600">Immediate Action</p>
              <p className="text-2xl font-bold text-gray-900">{stats.immediate}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center">
            <Calendar className="w-8 h-8 text-blue-500" />
            <div className="ml-3">
              <p className="text-sm text-gray-600">With Deadlines</p>
              <p className="text-2xl font-bold text-gray-900">{stats.withDeadlines}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center">
            <Shield className="w-8 h-8 text-green-500" />
            <div className="ml-3">
              <p className="text-sm text-gray-600">Total Warnings</p>
              <p className="text-2xl font-bold text-gray-900">{earlyWarnings.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-gray-700">Risk Level:</span>
          <select 
            value={selectedRiskLevel} 
            onChange={(e) => setSelectedRiskLevel(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 text-sm"
          >
            <option value="all">All Risk Levels</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
          <span className="text-sm text-gray-500">
            Showing {filteredWarnings.length} warnings
          </span>
        </div>
      </div>

      {/* Early Warning Alerts */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Early Warning Alerts</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {filteredWarnings.slice(0, 15).map((warning, idx) => {
            const WarningIcon = getWarningTypeIcon(warning.warningType);
            
            return (
              <div key={idx} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className={`p-2 rounded-full ${
                      warning.riskLevel === 'Critical' ? 'bg-red-100' :
                      warning.riskLevel === 'High' ? 'bg-orange-100' :
                      warning.riskLevel === 'Medium' ? 'bg-yellow-100' : 'bg-green-100'
                    }`}>
                      <WarningIcon className={`w-5 h-5 ${
                        warning.riskLevel === 'Critical' ? 'text-red-600' :
                        warning.riskLevel === 'High' ? 'text-orange-600' :
                        warning.riskLevel === 'Medium' ? 'text-yellow-600' : 'text-green-600'
                      }`} />
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900 mb-1">
                          {warning.headline}
                        </h3>
                        <p className="text-sm text-gray-600 mb-3">
                          {warning.impact}
                        </p>
                        
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <span className={`px-2 py-1 rounded text-xs font-medium border ${getRiskLevelColor(warning.riskLevel)}`}>
                            {warning.riskLevel} Risk
                          </span>
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                            {warning.warningType}
                          </span>
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                            {warning.timeToAction}
                          </span>
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                            {warning.businessImpact}
                          </span>
                        </div>

                        {warning.complianceDeadline && (
                          <div className="flex items-center text-sm text-red-600 mt-2">
                            <Calendar className="w-4 h-4 mr-1" />
                            <span>Deadline: {warning.complianceDeadline}</span>
                          </div>
                        )}

                        <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                          <span>{warning.authority}</span>
                          <span>{new Date(warning.fetched_date).toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      <div className="ml-4 flex-shrink-0">
                        <div className="text-right">
                          <div className="text-sm font-semibold text-gray-900">
                            Risk Score: {warning.riskScore}/9
                          </div>
                          <div className="w-16 bg-gray-200 rounded-full h-2 mt-1">
                            <div 
                              className={`h-2 rounded-full ${
                                warning.riskScore >= 7 ? 'bg-red-500' :
                                warning.riskScore >= 5 ? 'bg-orange-500' :
                                warning.riskScore >= 3 ? 'bg-yellow-500' : 'bg-green-500'
                              }`}
                              style={{ width: `${(warning.riskScore / 9) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Risk Assessment Summary */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Risk Assessment Summary</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Risk Distribution</h4>
              <div className="space-y-2">
                {['Critical', 'High', 'Medium', 'Low'].map(level => {
                  const count = earlyWarnings.filter(w => w.riskLevel === level).length;
                  const percentage = earlyWarnings.length > 0 ? (count / earlyWarnings.length) * 100 : 0;
                  
                  return (
                    <div key={level} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{level}:</span>
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-900 mr-2">{count}</span>
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${getRiskLevelColor(level).includes('red') ? 'bg-red-500' :
                              getRiskLevelColor(level).includes('orange') ? 'bg-orange-500' :
                              getRiskLevelColor(level).includes('green') ? 'bg-green-500' : 'bg-gray-500'
                            }`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Action Timeline</h4>
              <div className="space-y-2">
                {['Immediate', 'This Month', 'This Quarter', 'Monitor'].map(timeline => {
                  const count = earlyWarnings.filter(w => w.timeToAction === timeline).length;
                  
                  return (
                    <div key={timeline} className="flex justify-between text-sm">
                      <span className="text-gray-600">{timeline}:</span>
                      <span className="font-medium text-gray-900">{count} items</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegulatoryRadar;