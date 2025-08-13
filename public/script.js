// API Base URL - Use relative URL for deployment
const API_BASE = '/api';

// DOM Elements
const queryInput = document.getElementById('queryInput');
const submitBtn = document.getElementById('submitBtn');
const sqlSection = document.getElementById('sqlSection');
const sqlDisplay = document.getElementById('sqlDisplay');
const resultsSection = document.getElementById('resultsSection');
const resultsTable = document.getElementById('resultsTable');
const rowCount = document.getElementById('rowCount');
const suggestionsList = document.getElementById('suggestionsList');
const testCases = document.getElementById('testCases');
const schemaInfo = document.getElementById('schemaInfo');
const loadingOverlay = document.getElementById('loadingOverlay');
const toast = document.getElementById('toast');

// Initialize
window.addEventListener('DOMContentLoaded', () => {
    loadSuggestions();
    loadTestCases();
    loadSchema();
    
    // Enter key to submit
    queryInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            processQuery();
        }
    });
});

// Process Natural Language Query
async function processQuery() {
    const query = queryInput.value.trim();
    
    if (!query) {
        showToast('Please enter a query', 'error');
        return;
    }

    showLoading(true);
    hideResults();

    try {
        const response = await fetch(`${API_BASE}/query`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ query })
        });

        const data = await response.json();
        
        if (data.success) {
            displaySQL(data.sql);
            displayResults(data);
            showToast('Query executed successfully!', 'success');
        } else {
            showToast(data.error || 'Failed to process query', 'error');
            if (data.suggestions) {
                console.log('Suggestions:', data.suggestions);
            }
        }
    } catch (error) {
        showToast('Error connecting to server', 'error');
        console.error('Error:', error);
    } finally {
        showLoading(false);
    }
}

// Display SQL Query
function displaySQL(sql) {
    sqlDisplay.textContent = sql;
    sqlSection.classList.remove('hidden');
}

// Display Query Results
function displayResults(data) {
    if (!data.results || data.results.length === 0) {
        resultsTable.innerHTML = '<p class="no-results">No results found</p>';
        rowCount.textContent = '0 rows';
    } else {
        // Create table
        let tableHTML = '<table><thead><tr>';
        
        // Add headers
        data.columns.forEach(column => {
            tableHTML += `<th>${column}</th>`;
        });
        tableHTML += '</tr></thead><tbody>';
        
        // Add rows
        data.results.forEach(row => {
            tableHTML += '<tr>';
            data.columns.forEach(column => {
                const value = row[column] !== null ? row[column] : '<null>';
                tableHTML += `<td>${value}</td>`;
            });
            tableHTML += '</tr>';
        });
        
        tableHTML += '</tbody></table>';
        resultsTable.innerHTML = tableHTML;
        rowCount.textContent = `${data.rowCount} rows`;
    }
    
    resultsSection.classList.remove('hidden');
}

// Load Suggestions
async function loadSuggestions() {
    try {
        const response = await fetch(`${API_BASE}/suggestions`);
        const data = await response.json();
        
        if (data.success) {
            suggestionsList.innerHTML = data.suggestions
                .slice(0, 5)
                .map(suggestion => 
                    `<span class="suggestion-chip" onclick="useSuggestion('${suggestion}')">${suggestion}</span>`
                ).join('');
        }
    } catch (error) {
        console.error('Error loading suggestions:', error);
    }
}

// Use Suggestion
function useSuggestion(suggestion) {
    queryInput.value = suggestion;
    queryInput.focus();
}

// Load Test Cases
async function loadTestCases() {
    try {
        const response = await fetch(`${API_BASE}/test-cases`);
        const data = await response.json();
        
        if (data.success) {
            testCases.innerHTML = data.testCases
                .map(category => `
                    <div class="test-category">
                        <h4>${category.category}</h4>
                        ${category.queries.map(query => 
                            `<div class="test-query" onclick="useTestQuery('${query}')">${query}</div>`
                        ).join('')}
                    </div>
                `).join('');
        }
    } catch (error) {
        console.error('Error loading test cases:', error);
    }
}

// Use Test Query
function useTestQuery(query) {
    queryInput.value = query;
    processQuery();
}

// Load Database Schema
async function loadSchema() {
    try {
        const response = await fetch(`${API_BASE}/schema`);
        const data = await response.json();
        
        if (data.success) {
            let schemaHTML = '';
            
            for (const [tableName, columns] of Object.entries(data.schema)) {
                schemaHTML += `
                    <div class="table-schema">
                        <h5>📊 ${tableName}</h5>
                        ${columns.map(col => 
                            `<div class="column-info">
                                ${col.primaryKey ? '<span class="pk">🔑</span>' : '•'} 
                                ${col.name} <span style="color: #95a5a6">(${col.type})</span>
                            </div>`
                        ).join('')}
                    </div>
                `;
            }
            
            schemaInfo.innerHTML = schemaHTML;
        }
    } catch (error) {
        console.error('Error loading schema:', error);
    }
}

// Toggle Schema Visibility
function toggleSchema() {
    schemaInfo.classList.toggle('hidden');
}

// Copy SQL to Clipboard
function copySQL() {
    const sql = sqlDisplay.textContent;
    navigator.clipboard.writeText(sql).then(() => {
        showToast('SQL copied to clipboard!', 'success');
    }).catch(() => {
        showToast('Failed to copy SQL', 'error');
    });
}

// Show/Hide Loading
function showLoading(show) {
    if (show) {
        loadingOverlay.classList.remove('hidden');
    } else {
        loadingOverlay.classList.add('hidden');
    }
}

// Hide Results
function hideResults() {
    sqlSection.classList.add('hidden');
    resultsSection.classList.add('hidden');
}

// Show Toast Notification
function showToast(message, type = 'success') {
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}