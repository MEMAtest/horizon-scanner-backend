function getContentModule() {
  return `
    // Content Module
    const ContentModule = (function() {
        function parseDate(value) {
            if (!value) return null;
            const date = new Date(value);
            return isNaN(date) ? null : date;
        }

        function formatDateDisplay(value) {
            const date = parseDate(value);
            if (!date) return 'Unknown';
            return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
        }

        function truncateText(text, maxLength = 120) {
            if (!text) return '';
            const trimmed = text.trim();
            if (trimmed.length <= maxLength) return trimmed;
            return trimmed.substring(0, maxLength).trim() + '...';
        }

        function isFallbackSummary(summary = '') {
            const normalized = summary.trim().toLowerCase();
            return normalized.startsWith('informational regulatory update') ||
                   normalized.startsWith('significant regulatory development') ||
                   normalized.startsWith('regulatory update') ||
                   normalized.startsWith('regulatory impact overview');
        }

        function generateRelevanceBasedStreams(updates) {
            if (!updates || !Array.isArray(updates)) return;
            
            const streamContainer = document.getElementById('intelligenceStreams');
            if (!streamContainer) return;
            
            const urgent = updates.filter(u => u.urgency === 'High' || u.impactLevel === 'Significant');
            const moderate = updates.filter(u => u.urgency === 'Medium' || u.impactLevel === 'Moderate');  
            const background = updates.filter(u => u.urgency === 'Low' || u.impactLevel === 'Informational');
            
            streamContainer.innerHTML = \`
                \${generateStream('urgent', '🔴 Critical Impact', urgent, true)}
                \${generateStream('moderate', '🟡 Active Monitoring', moderate, false)}
                \${generateStream('background', '🟢 Background Intelligence', background, false)}
            \`;
        }
        
        function generateStream(id, title, updates, isExpanded = false) {
            const updateCards = updates.slice(0, 5).map(update => generateUpdateCard(update)).join('');
            const expandClass = isExpanded ? 'expanded' : '';
            const expandText = isExpanded ? 'Collapse' : 'Expand';
            const expandIcon = isExpanded ? '🔽' : '▶️';
            
            return \`
                <div class="intelligence-stream \${expandClass}" id="\${id}">
                    <div class="stream-header" onclick="ContentModule.toggleStreamExpansion('\${id}')">
                        <h3>\${title}</h3>
                        <div class="stream-controls">
                            <span class="update-count">\${updates.length} updates</span>
                            <button class="expand-btn">
                                <span>\${expandIcon}</span>
                                <span>\${expandText}</span>
                            </button>
                        </div>
                    </div>
                    <div class="stream-content">
                        \${updateCards}
                        \${updates.length > 5 ? \`<button class="load-more-btn" id="loadMoreBtn-\${id}" onclick="SearchModule.loadMoreUpdatesForStream(\\'\${id}\\', \${updates.length})">Load More (\${updates.length - 5} remaining)</button>\` : ''}
                    </div>
                </div>
            \`;
        }
        
        function generateUpdateCard(update) {
            const impactColor = update.urgency === 'High' ? 'urgent' : update.urgency === 'Medium' ? 'moderate' : 'low';
            const aiSummary = update.ai_summary || update.impact || '';
            const useFallback = isFallbackSummary(aiSummary);
            const baseSummary = !useFallback && aiSummary.trim().length > 0
                ? aiSummary.trim()
                : (update.summary || update.description || '').trim();
            const shortSummary = truncateText(baseSummary);
            const isPinned = pinnedUrls.has(update.url);
            const displayDate = formatDateDisplay(update.publishedDate || update.published_date || update.fetchedDate || update.createdAt);
            
            return \`
                <div class="update-card" data-authority="\${update.authority}" data-impact="\${update.impactLevel}" data-urgency="\${update.urgency}" data-url="\${update.url}">
                    <div class="update-header">
                        <h4 class="update-headline">\${update.headline || 'No headline'}</h4>
                        <div class="update-badges">
                            <span class="authority-badge">\${update.authority || 'Unknown'}</span>
                            <span class="impact-badge \${impactColor}">\${update.urgency || 'Low'}</span>
                            <button class="pin-btn \${isPinned ? 'pinned' : ''}" onclick="WorkspaceModule.togglePin('\${update.url}')">\${isPinned ? '📌' : '📍'}</button>
                        </div>
                    </div>
                    <div class="update-content">
                        <p class="update-summary truncated" id="summary-\${update.id}">\${shortSummary || 'No summary available'}</p>
                        \${baseSummary && baseSummary.length > 120 ? \`
                            <button class="read-more-btn" onclick="ContentModule.toggleSummaryExpansion(\${update.id}, \\\`\${baseSummary.replace(/'/g, '')}\\\`)">Read More</button>
                        \` : ''}
                    </div>
                    <div class="update-footer">
                        <span class="update-date">\${displayDate}</span>
                        <button class="view-details-btn" onclick="ContentModule.viewUpdateDetails('\${update.id}', '\${update.url}')">View Details</button>
                    </div>
                </div>
            \`;
        }

        
        function toggleStreamExpansion(streamId) {
            const stream = document.getElementById(streamId);
            if (!stream) return;
            
            const content = stream.querySelector('.stream-content');
            const expandBtn = stream.querySelector('.expand-btn');
            
            if (expandedStreams.has(streamId)) {
                expandedStreams.delete(streamId);
                stream.classList.remove('expanded');
                if (content) content.classList.remove('expanded');
                if (expandBtn) expandBtn.innerHTML = '<span>▶️</span><span>Expand</span>';
            } else {
                expandedStreams.add(streamId);
                stream.classList.add('expanded');
                if (content) content.classList.add('expanded');
                if (expandBtn) expandBtn.innerHTML = '<span>🔽</span><span>Collapse</span>';
            }
        }
        
        function toggleSummaryExpansion(updateId, fullContent) {
            const summaryElement = document.getElementById('summary-' + updateId);
            const readMoreBtn = summaryElement?.nextElementSibling;
            
            if (!summaryElement) return;
            
            if (summaryElement.classList.contains('truncated')) {
                summaryElement.textContent = fullContent;
                summaryElement.classList.remove('truncated');
                summaryElement.classList.add('expanded');
                if (readMoreBtn) readMoreBtn.textContent = 'Read Less';
            } else {
                const shortContent = fullContent.length > 120 ? fullContent.substring(0, 120) + '...' : fullContent;
                summaryElement.textContent = shortContent;
                summaryElement.classList.add('truncated');
                summaryElement.classList.remove('expanded');
                if (readMoreBtn) readMoreBtn.textContent = 'Read More';
            }
        }
        
        function viewUpdateDetails(updateId, url) {
            if (updateId) {
                // Use internal detail page
                window.open('/update/' + updateId, '_blank');
            } else if (url) {
                // Fallback to external URL
                window.open(url, '_blank');
            }
        }
        
        function updateAnalyticsPreview() {
            if (!analyticsPreviewData) return;
            
            const previewContainer = document.getElementById('analyticsPreview');
            if (previewContainer) {
                previewContainer.innerHTML =
                    '<div class="analytics-metric">' +
                        '<span class="metric-label">Total Updates</span>' +
                        '<span class="metric-value">' + (analyticsPreviewData.totalUpdates || 0) + '</span>' +
                    '</div>' +
                    '<div class="analytics-metric">' +
                        '<span class="metric-label">Avg Risk Score</span>' +
                        '<span class="metric-value">' + (analyticsPreviewData.averageRiskScore || 0).toFixed(1) + '</span>' +
                    '</div>';
            }
        }
        
        return {
            generateRelevanceBasedStreams,
            generateStream,
            generateUpdateCard,
            toggleStreamExpansion,
            toggleSummaryExpansion,
            viewUpdateDetails,
            updateAnalyticsPreview
        };
    })();`
}

module.exports = { getContentModule }
