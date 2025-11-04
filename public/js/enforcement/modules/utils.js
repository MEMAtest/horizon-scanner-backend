function applyUtilsMixin(klass) {
  Object.assign(klass.prototype, {
    formatNumber(value) {
        const number = Number(value || 0);
        return new Intl.NumberFormat('en-GB', { maximumFractionDigits: 0 }).format(number);
    },

    formatCurrency(amount) {
        if (amount === undefined || amount === null) return 'N/A';
        return new Intl.NumberFormat('en-GB', {
            style: 'currency',
            currency: 'GBP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    },

    formatDate(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    },

    escapeHtml(value) {
        if (value === null || value === undefined) return '';
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    },

    renderRiskBadge(riskScore) {
        if (!riskScore) return '<span class="risk-badge">N/A</span>';
    
        if (riskScore >= 70) {
            return '<span class="risk-badge risk-high">High (' + riskScore + ')</span>';
        } else if (riskScore >= 40) {
            return '<span class="risk-badge risk-medium">Medium (' + riskScore + ')</span>';
        } else {
            return '<span class="risk-badge risk-low">Low (' + riskScore + ')</span>';
        }
    },

    getStatIcon(type) {
        const palette = {
            total: 'icon-blue',
            fines: 'icon-amber',
            recent: 'icon-plum',
            risk: 'icon-crimson'
        };
    
        const icons = {
            total: '<svg viewBox="0 0 24 24" aria-hidden="true">' +
                '<path d="M12 3v16"></path>' +
                '<path d="M5 7h14"></path>' +
                '<path d="M7 7 4 13h6l-3-6z"></path>' +
                '<path d="M17 7 14 13h6l-3-6z"></path>' +
            '</svg>',
            fines: '<svg viewBox="0 0 24 24" aria-hidden="true">' +
                '<ellipse cx="12" cy="6" rx="6" ry="2.5"></ellipse>' +
                '<path d="M6 6v6c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5V6"></path>' +
                '<path d="M6 12v6c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5v-6"></path>' +
            '</svg>',
            recent: '<svg viewBox="0 0 24 24" aria-hidden="true">' +
                '<rect x="3.5" y="5" width="17" height="15" rx="2"></rect>' +
                '<path d="M16 4v3"></path>' +
                '<path d="M8 4v3"></path>' +
                '<path d="M3.5 9h17"></path>' +
                '<path d="M9 13h4"></path>' +
            '</svg>',
            risk: '<svg viewBox="0 0 24 24" aria-hidden="true">' +
                '<path d="M12 3 5 6v5c0 4.6 3.4 8.3 7 9 3.6-.7 7-4.4 7-9V6l-7-3z"></path>' +
                '<path d="M9.5 11.5 12 14l3-3.5"></path>' +
            '</svg>'
        };
    
        const iconHtml = icons[type] || icons.total;
        const paletteClass = palette[type] || palette.total;
        return '<div class="stat-icon ' + paletteClass + '">' + iconHtml + '</div>';
    }
  })
}
export { applyUtilsMixin }
