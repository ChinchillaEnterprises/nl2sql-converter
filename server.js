const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const DatabaseSetup = require('./src/database/setupDatabase');
const NL2SQLEngine = require('./src/nl2sql/engine');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Initialize database and engine
let nl2sqlEngine;

async function initialize() {
  try {
    // Setup database
    const dbSetup = new DatabaseSetup();
    await dbSetup.setup();
    
    // Initialize NL2SQL engine
    nl2sqlEngine = new NL2SQLEngine();
    
    console.log('Server initialized successfully');
  } catch (error) {
    console.error('Failed to initialize:', error);
    process.exit(1);
  }
}

// API Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Process natural language query
app.post('/api/query', async (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Query is required'
      });
    }

    const result = await nl2sqlEngine.translateAndExecute(query);
    res.json(result);
    
  } catch (error) {
    console.error('Query error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get database schema
app.get('/api/schema', async (req, res) => {
  try {
    const schema = await nl2sqlEngine.getSchema();
    res.json({
      success: true,
      schema
    });
  } catch (error) {
    console.error('Schema error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get query suggestions
app.get('/api/suggestions', (req, res) => {
  res.json({
    success: true,
    suggestions: nl2sqlEngine.getSuggestions()
  });
});

// Get test cases
app.get('/api/test-cases', (req, res) => {
  const testCases = [
    {
      category: "Dynamic Product Sales",
      queries: [
        "Sales of Laptop Pro 15 on 2023-03-15",
        "Sales of Wireless Mouse between 2023-01-01 and 2023-03-31",
        "How many Office Chair were sold?",
        "Sales of USB-C Hub in 2023-02",
        "Show me sales of Monitor 27\" on 2023-05-01"
      ]
    },
    {
      category: "Dynamic Customer Queries",
      queries: [
        "Sales to Acme Corp",
        "What did TechStart Inc buy?",
        "Show purchases by Global Ventures",
        "Sales to Innovation Labs"
      ]
    },
    {
      category: "Dynamic Price/Salary Queries",
      queries: [
        "Products priced between $50 and $500",
        "Products costing between $20 and $100",
        "Employees with salary above $100000",
        "Who earns more than $90000?"
      ]
    },
    {
      category: "Dynamic Category Queries",
      queries: [
        "Revenue by Electronics category",
        "Sales of Furniture products",
        "Revenue from Electronics type"
      ]
    },
    {
      category: "Standard Employee Queries",
      queries: [
        "Show me all employees",
        "Who works in engineering?",
        "Show me the highest paid employees",
        "What is the average salary by department?"
      ]
    },
    {
      category: "Standard Sales Queries",
      queries: [
        "What are the total sales?",
        "Show me monthly sales",
        "What are the top selling products?",
        "Show me sales by employee"
      ]
    }
  ];
  
  res.json({
    success: true,
    testCases
  });
});

// Start server
initialize().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 NL2SQL Server running on port ${PORT}`);
    console.log('📊 Database initialized with sample data');
    console.log('🔍 Ready to process natural language queries\n');
  });
});