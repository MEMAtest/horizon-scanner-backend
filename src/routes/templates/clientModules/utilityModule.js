function getUtilityModule() {
    return `
    // Utility Module
    const UtilityModule = (function() {
        function showMessage(message, type = 'info') {
            console.log(\`\${type.toUpperCase()}: \${message}\`);
            
            const toast = document.createElement('div');
            const bgColor = type === 'error' ? '#fef2f2' : type === 'success' ? '#f0fdf4' : type === 'warning' ? '#fffbeb' : '#f0f9ff';
            const textColor = type === 'error' ? '#dc2626' : type === 'success' ? '#059669' : type === 'warning' ? '#d97706' : '#2563eb';
            
            toast.style.cssText = \`
                position: fixed;
                top: 20px;
                right: 20px;
                background: \${bgColor};
                color: \${textColor};
                padding: 12px 16px;
                border-radius: 8px;
                border: 1px solid;
                border-color: \${textColor}33;
                font-size: 14px;
                z-index: 10000;
                max-width: 350px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            \`;
            toast.textContent = message;
            
            document.body.appendChild(toast);
            
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 4000);
        }
        
        function clearMessages() {
            document.querySelectorAll('[style*="position: fixed"][style*="top: 20px"]').forEach(toast => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            });
        }
        
        return {
            showMessage,
            clearMessages
        };
    })();
    
    // Expose globally for use by all modules
    window.showMessage = UtilityModule.showMessage;
    window.clearMessages = UtilityModule.clearMessages;`;
}

module.exports = { getUtilityModule };