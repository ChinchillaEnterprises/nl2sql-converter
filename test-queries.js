const NL2SQLEngine = require('./src/nl2sql/engine');

async function testQueries() {
  const engine = new NL2SQLEngine();
  
  const testQueries = [
    "Show me all employees",
    "Who works in engineering?",
    "Show me the highest paid employees",
    "What is the average salary by department?",
    "What are the total sales?",
    "Show me monthly sales",
    "What are the top selling products?",
    "Show me sales by employee",
    "Sales of Furniture products",
    "Revenue from Electronics type"
  ];

  console.log('Testing NL2SQL Queries\n');
  console.log('='.repeat(80));

  for (const query of testQueries) {
    console.log(`\nQuery: "${query}"`);
    console.log('-'.repeat(80));
    
    try {
      const result = await engine.translateAndExecute(query);
      
      if (result.success) {
        console.log(`✓ Success! Found ${result.rowCount} results`);
        console.log(`SQL: ${result.sql.replace(/\s+/g, ' ').substring(0, 100)}...`);
        if (result.results.length > 0) {
          console.log('Sample result:', JSON.stringify(result.results[0], null, 2));
        }
      } else {
        console.log(`✗ Failed: ${result.error}`);
      }
    } catch (error) {
      console.log(`✗ Error: ${error.message}`);
    }
  }
}

// Run the tests
testQueries().catch(console.error);