const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'data', 'tokens.json');

// Model mapping
const MODEL_MAP = {
    'kimi-k2.5': 'kimi',
    'gemini-2.0-flash': 'flash',
    'gemini-2.5-pro': 'pro',
    'google/gemini-2.0-flash': 'flash',
    'google/gemini-2.5-pro': 'pro',
    'moonshot/kimi-k2.5': 'kimi'
};

// Load current token data
function loadTokenData() {
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error loading token data:', error.message);
        return createDefaultData();
    }
}

// Save token data
function saveTokenData(data) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
        console.log('✅ Token data updated');
    } catch (error) {
        console.error('Error saving token data:', error.message);
    }
}

// Create default data structure
function createDefaultData() {
    return {
        lastUpdated: new Date().toISOString(),
        models: {
            kimi: {
                name: 'Kimi (K2.5)',
                sessionTokens: 0,
                monthlyTokens: 0,
                monthlyLimit: 1000000,
                costPer1M: 3.00
            },
            flash: {
                name: 'Gemini Flash',
                sessionTokens: 0,
                monthlyTokens: 0,
                monthlyLimit: 500000,
                costPer1M: 0.50
            },
            pro: {
                name: 'Gemini Pro',
                sessionTokens: 0,
                monthlyTokens: 0,
                monthlyLimit: 200000,
                costPer1M: 5.00
            }
        },
        sessionHistory: []
    };
}

// Update tokens from session data
function updateTokensFromSession(sessionData) {
    const data = loadTokenData();
    
    // Get model key
    const modelKey = MODEL_MAP[sessionData.model] || 'kimi';
    
    // Calculate tokens used in this session
    const sessionTokens = sessionData.totalTokens || 0;
    
    // Update session tokens (current conversation)
    data.models[modelKey].sessionTokens = sessionTokens;
    
    // Add to history if significant change (>100 tokens)
    const lastEntry = data.sessionHistory[data.sessionHistory.length - 1];
    const shouldLog = !lastEntry || 
                      lastEntry.model !== modelKey || 
                      Math.abs(sessionTokens - (lastEntry.tokens || 0)) > 100;
    
    if (shouldLog) {
        data.sessionHistory.push({
            timestamp: new Date().toISOString(),
            model: modelKey,
            tokens: sessionTokens
        });
        
        // Keep only last 50 entries
        if (data.sessionHistory.length > 50) {
            data.sessionHistory = data.sessionHistory.slice(-50);
        }
    }
    
    // Update timestamp
    data.lastUpdated = new Date().toISOString();
    
    saveTokenData(data);
    
    console.log(`📊 ${data.models[modelKey].name}: ${sessionTokens.toLocaleString()} tokens`);
}

// Simulate fetching from OpenClaw (in production, this would call the actual API)
async function fetchSessionData() {
    // In the actual implementation, this would call OpenClaw's session endpoint
    // For now, we'll accept data via command line arguments
    const args = process.argv.slice(2);
    
    if (args.length >= 2) {
        // Format: node update-tokens.js <model> <tokens>
        // Example: node update-tokens.js kimi-k2.5 23422
        return {
            model: args[0],
            totalTokens: parseInt(args[1], 10) || 0
        };
    }
    
    // Try to read from environment or stdin
    if (process.env.OPENCLAW_TOKENS && process.env.OPENCLAW_MODEL) {
        return {
            model: process.env.OPENCLAW_MODEL,
            totalTokens: parseInt(process.env.OPENCLAW_TOKENS, 10) || 0
        };
    }
    
    return null;
}

// Manual update mode
function manualUpdate() {
    const data = loadTokenData();
    
    console.log('\n📝 Manual Token Update');
    console.log('=====================\n');
    
    console.log('Current values:');
    console.log(`  Kimi:  ${data.models.kimi.monthlyTokens.toLocaleString()} monthly, ${data.models.kimi.sessionTokens.toLocaleString()} session`);
    console.log(`  Flash: ${data.models.flash.monthlyTokens.toLocaleString()} monthly, ${data.models.flash.sessionTokens.toLocaleString()} session`);
    console.log(`  Pro:   ${data.models.pro.monthlyTokens.toLocaleString()} monthly, ${data.models.pro.sessionTokens.toLocaleString()} session`);
    console.log('\nTo update, use: node update-tokens.js <model> <session-tokens>');
    console.log('Example: node update-tokens.js kimi-k2.5 25000');
    console.log('\nOr set environment variables:');
    console.log('  OPENCLAW_MODEL=kimi-k2.5 OPENCLAW_TOKENS=25000 node update-tokens.js');
}

// Main
async function main() {
    console.log('🤖 Baymax Token Tracker - Update Script\n');
    
    const sessionData = await fetchSessionData();
    
    if (sessionData) {
        updateTokensFromSession(sessionData);
    } else {
        manualUpdate();
    }
}

main().catch(console.error);
