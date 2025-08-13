const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class NL2SQLEngine {
  constructor(dbSetup) {
    this.dbSetup = dbSetup;
    this.templates = this.initializeTemplates();
  }

  initializeTemplates() {
    return [
      // Dynamic Product Sales Queries
      {
        patterns: [
          /sales\s+(?:of\s+|for\s+)?(?:product\s+)?["']?([^"']+?)["']?\s+(?:on|in|during)\s+(\d{4}-\d{2}-\d{2})/i,
          /(?:show\s+)?sales\s+(?:of\s+|for\s+)?["']?([^"']+?)["']?\s+(?:on|in)\s+(\d{4}-\d{2}-\d{2})/i
        ],
        sql: (matches) => `SELECT p.product_name, s.sale_date, s.quantity, s.total_amount,
              c.customer_name, e.first_name || ' ' || e.last_name as sold_by
              FROM sales s
              JOIN products p ON s.product_id = p.product_id
              JOIN customers c ON s.customer_id = c.customer_id
              JOIN employees e ON s.employee_id = e.employee_id
              WHERE LOWER(p.product_name) LIKE LOWER('%${matches[1]}%')
              AND date(s.sale_date) = '${matches[2]}'
              ORDER BY s.sale_date`,
        description: "Sales of specific product on specific date"
      },

      {
        patterns: [
          /sales\s+(?:of\s+|for\s+)?(?:product\s+)?["']?([^"']+?)["']?\s+(?:between|from)\s+(\d{4}-\d{2}-\d{2})\s+(?:to|and)\s+(\d{4}-\d{2}-\d{2})/i,
          /(?:show\s+)?sales\s+(?:of\s+|for\s+)?["']?([^"']+?)["']?\s+(?:between|from)\s+(\d{4}-\d{2}-\d{2})\s+(?:to|and)\s+(\d{4}-\d{2}-\d{2})/i
        ],
        sql: (matches) => `SELECT p.product_name, s.sale_date, 
              SUM(s.quantity) as total_quantity,
              SUM(s.total_amount) as total_revenue,
              COUNT(DISTINCT s.customer_id) as unique_customers
              FROM sales s
              JOIN products p ON s.product_id = p.product_id
              WHERE LOWER(p.product_name) LIKE LOWER('%${matches[1]}%')
              AND s.sale_date BETWEEN '${matches[2]}' AND '${matches[3]}'
              GROUP BY p.product_name, s.sale_date
              ORDER BY s.sale_date`,
        description: "Sales of specific product between date range"
      },

      {
        patterns: [
          /sales\s+(?:of\s+|for\s+)?(?:product\s+)?["']?([^"']+?)["']?(?:\s+in\s+(\d{4}-\d{2}))?/i,
          /(?:show\s+)?(?:me\s+)?sales\s+(?:of\s+|for\s+)?["']?([^"']+?)["']?(?:\s+in\s+(\w+\s+\d{4}))?/i,
          /how\s+many\s+["']?([^"']+?)["']?\s+(?:were\s+)?sold/i
        ],
        sql: (matches) => {
          let dateFilter = '';
          if (matches[2]) {
            dateFilter = `AND strftime('%Y-%m', s.sale_date) = '${matches[2]}'`;
          }
          return `SELECT p.product_name, 
                COUNT(s.sale_id) as number_of_sales,
                SUM(s.quantity) as total_quantity_sold,
                ROUND(SUM(s.total_amount), 2) as total_revenue,
                ROUND(AVG(s.total_amount), 2) as avg_sale_value
                FROM sales s
                JOIN products p ON s.product_id = p.product_id
                WHERE LOWER(p.product_name) LIKE LOWER('%${matches[1]}%')
                ${dateFilter}
                GROUP BY p.product_name`;
        },
        description: "Sales summary for specific product"
      },

      {
        patterns: [
          /sales\s+to\s+(?:customer\s+)?["']?([^"']+?)["']?/i,
          /what\s+did\s+(?:customer\s+)?["']?([^"']+?)["']?\s+buy/i,
          /(?:show\s+)?purchases\s+(?:by|from)\s+(?:customer\s+)?["']?([^"']+?)["']?/i
        ],
        sql: (matches) => `SELECT c.customer_name, p.product_name, s.sale_date,
              s.quantity, s.total_amount
              FROM sales s
              JOIN customers c ON s.customer_id = c.customer_id
              JOIN products p ON s.product_id = p.product_id
              WHERE LOWER(c.customer_name) LIKE LOWER('%${matches[1]}%')
              ORDER BY s.sale_date DESC`,
        description: "Sales to specific customer"
      },

      {
        patterns: [
          /products?\s+(?:priced\s+)?(?:between|from)\s+\$?(\d+(?:\.\d{2})?)\s+(?:to|and)\s+\$?(\d+(?:\.\d{2})?)/i,
          /products?\s+(?:costing\s+)?(?:between|from)\s+\$?(\d+(?:\.\d{2})?)\s+(?:to|and)\s+\$?(\d+(?:\.\d{2})?)/i
        ],
        sql: (matches) => `SELECT product_name, category, price, stock_quantity
              FROM products
              WHERE price BETWEEN ${matches[1]} AND ${matches[2]}
              ORDER BY price`,
        description: "Products within price range"
      },

      {
        patterns: [
          /employees?\s+(?:with\s+)?salary\s+(?:above|over|greater\s+than)\s+\$?(\d+)/i,
          /who\s+earns?\s+(?:more\s+than|over)\s+\$?(\d+)/i
        ],
        sql: (matches) => `SELECT e.first_name, e.last_name, e.position, 
              d.department_name, e.salary
              FROM employees e
              JOIN departments d ON e.department_id = d.department_id
              WHERE e.salary > ${matches[1]}
              ORDER BY e.salary DESC`,
        description: "Employees earning above specified amount"
      },

      {
        patterns: [
          /revenue\s+(?:by|from)\s+["']?([^"']+?)["']?\s+(?:category|type)/i,
          /sales\s+(?:of\s+)?(\w+)\s+(?:category|products)/i,
          /sales\s+of\s+(\w+)\s+products/i,
          /revenue\s+from\s+(\w+)\s+type/i
        ],
        sql: (matches) => `SELECT p.category, 
              COUNT(DISTINCT p.product_id) as products_in_category,
              SUM(s.quantity) as units_sold,
              ROUND(SUM(s.total_amount), 2) as total_revenue
              FROM sales s
              JOIN products p ON s.product_id = p.product_id
              WHERE LOWER(p.category) LIKE LOWER('%${matches[1]}%')
              GROUP BY p.category`,
        description: "Revenue by product category"
      },

      // Employee queries
      {
        patterns: [
          /show\s+(?:me\s+)?(?:all\s+)?employees/i,
          /list\s+(?:all\s+)?employees/i,
          /get\s+(?:all\s+)?employees/i
        ],
        sql: `SELECT e.employee_id, e.first_name, e.last_name, e.email, 
              d.department_name, e.position, e.salary, e.hire_date
              FROM employees e
              LEFT JOIN departments d ON e.department_id = d.department_id
              ORDER BY e.employee_id`,
        description: "Get all employees with their department information"
      },

      {
        patterns: [
          /employees\s+in\s+(\w+)(?:\s+department)?/i,
          /who\s+works\s+in\s+(\w+)/i,
          /show\s+(\w+)\s+department\s+employees/i
        ],
        sql: (matches) => `SELECT e.employee_id, e.first_name, e.last_name, e.position, e.salary
              FROM employees e
              JOIN departments d ON e.department_id = d.department_id
              WHERE LOWER(d.department_name) LIKE LOWER('%${matches[1]}%')
              ORDER BY e.salary DESC`,
        description: "Get employees in a specific department"
      },

      {
        patterns: [
          /highest\s+paid\s+employees?/i,
          /top\s+(?:paid\s+)?employees?\s+by\s+salary/i,
          /employees?\s+with\s+highest\s+salary/i
        ],
        sql: `SELECT first_name, last_name, position, salary, department_name
              FROM employees e
              JOIN departments d ON e.department_id = d.department_id
              ORDER BY salary DESC
              LIMIT 5`,
        description: "Get top 5 highest paid employees"
      },

      {
        patterns: [
          /average\s+salary\s+by\s+department/i,
          /department\s+average\s+salaries/i,
          /what\s+is\s+the\s+average\s+salary\s+(?:by\s+|per\s+)?department/i
        ],
        sql: `SELECT d.department_name, 
              COUNT(e.employee_id) as employee_count,
              ROUND(AVG(e.salary), 2) as avg_salary,
              MIN(e.salary) as min_salary,
              MAX(e.salary) as max_salary
              FROM departments d
              LEFT JOIN employees e ON d.department_id = e.department_id
              GROUP BY d.department_name
              ORDER BY avg_salary DESC`,
        description: "Average salary by department"
      },

      // Sales queries
      {
        patterns: [
          /total\s+sales/i,
          /show\s+(?:me\s+)?total\s+revenue/i,
          /what\s+(?:is\s+|are\s+)?(?:the\s+)?total\s+sales/i
        ],
        sql: `SELECT COUNT(*) as total_transactions,
              SUM(quantity) as total_units_sold,
              ROUND(SUM(total_amount), 2) as total_revenue
              FROM sales`,
        description: "Get total sales summary"
      },

      {
        patterns: [
          /sales\s+by\s+month/i,
          /monthly\s+sales/i,
          /revenue\s+by\s+month/i
        ],
        sql: `SELECT strftime('%Y-%m', sale_date) as month,
              COUNT(*) as transactions,
              SUM(quantity) as units_sold,
              ROUND(SUM(total_amount), 2) as revenue
              FROM sales
              GROUP BY month
              ORDER BY month DESC`,
        description: "Monthly sales breakdown"
      },

      {
        patterns: [
          /top\s+(?:selling\s+)?products/i,
          /best\s+selling\s+products/i,
          /most\s+sold\s+products/i
        ],
        sql: `SELECT p.product_name, p.category,
              SUM(s.quantity) as total_quantity_sold,
              COUNT(s.sale_id) as number_of_sales,
              ROUND(SUM(s.total_amount), 2) as total_revenue
              FROM products p
              JOIN sales s ON p.product_id = s.product_id
              GROUP BY p.product_id, p.product_name, p.category
              ORDER BY total_quantity_sold DESC
              LIMIT 10`,
        description: "Top 10 best selling products"
      },

      {
        patterns: [
          /sales\s+by\s+employee/i,
          /employee\s+sales\s+performance/i,
          /who\s+sold\s+the\s+most/i
        ],
        sql: `SELECT e.first_name || ' ' || e.last_name as employee_name,
              e.position,
              COUNT(s.sale_id) as number_of_sales,
              SUM(s.quantity) as units_sold,
              ROUND(SUM(s.total_amount), 2) as total_revenue
              FROM employees e
              JOIN sales s ON e.employee_id = s.employee_id
              GROUP BY e.employee_id, e.first_name, e.last_name, e.position
              ORDER BY total_revenue DESC`,
        description: "Sales performance by employee"
      },

      // Product queries
      {
        patterns: [
          /products?\s+(?:with\s+)?low\s+stock/i,
          /low\s+inventory/i,
          /products?\s+running\s+out/i
        ],
        sql: `SELECT product_name, category, stock_quantity, price
              FROM products
              WHERE stock_quantity < 50
              ORDER BY stock_quantity ASC`,
        description: "Products with low stock (less than 50 units)"
      },

      {
        patterns: [
          /products?\s+by\s+category/i,
          /(?:show\s+)?product\s+categories/i,
          /what\s+categories\s+(?:do\s+we\s+have|are\s+there)/i
        ],
        sql: `SELECT category,
              COUNT(*) as product_count,
              ROUND(AVG(price), 2) as avg_price,
              SUM(stock_quantity) as total_stock
              FROM products
              GROUP BY category
              ORDER BY product_count DESC`,
        description: "Product summary by category"
      },

      // Customer queries
      {
        patterns: [
          /top\s+customers/i,
          /best\s+customers/i,
          /customers?\s+by\s+(?:revenue|sales)/i
        ],
        sql: `SELECT c.customer_name, c.city, c.country,
              COUNT(s.sale_id) as number_of_orders,
              SUM(s.quantity) as total_units,
              ROUND(SUM(s.total_amount), 2) as total_spent
              FROM customers c
              JOIN sales s ON c.customer_id = s.customer_id
              GROUP BY c.customer_id, c.customer_name, c.city, c.country
              ORDER BY total_spent DESC
              LIMIT 10`,
        description: "Top 10 customers by revenue"
      },

      {
        patterns: [
          /customers?\s+by\s+country/i,
          /where\s+(?:are\s+)?(?:our\s+)?customers?\s+(?:from|located)/i,
          /customer\s+distribution/i
        ],
        sql: `SELECT country,
              COUNT(*) as customer_count,
              COUNT(DISTINCT city) as cities
              FROM customers
              GROUP BY country
              ORDER BY customer_count DESC`,
        description: "Customer distribution by country"
      },

      // Project queries
      {
        patterns: [
          /active\s+projects/i,
          /current\s+projects/i,
          /projects?\s+in\s+progress/i
        ],
        sql: `SELECT p.project_name, d.department_name,
              p.start_date, p.end_date, p.budget, p.status
              FROM projects p
              JOIN departments d ON p.department_id = d.department_id
              WHERE p.status IN ('In Progress', 'Active')
              ORDER BY p.start_date`,
        description: "Currently active projects"
      },

      {
        patterns: [
          /project\s+budget\s+(?:usage|summary)/i,
          /how\s+much\s+(?:have\s+we\s+)?spent\s+on\s+projects/i,
          /total\s+project\s+budget/i
        ],
        sql: `SELECT SUM(budget) as total_budget,
              COUNT(*) as total_projects,
              ROUND(AVG(budget), 2) as avg_budget,
              MAX(budget) as max_budget,
              MIN(budget) as min_budget
              FROM projects`,
        description: "Project budget summary"
      },

      // Complex queries
      {
        patterns: [
          /department\s+(?:performance|summary|overview)/i,
          /how\s+(?:is|are)\s+(?:each\s+)?department(?:s)?\s+doing/i
        ],
        sql: `SELECT 
              d.department_name,
              d.location,
              COUNT(DISTINCT e.employee_id) as employee_count,
              ROUND(AVG(e.salary), 2) as avg_salary,
              COUNT(DISTINCT p.project_id) as active_projects,
              COALESCE(SUM(p.budget), 0) as total_project_budget
              FROM departments d
              LEFT JOIN employees e ON d.department_id = e.department_id
              LEFT JOIN projects p ON d.department_id = p.department_id AND p.status IN ('Active', 'In Progress')
              GROUP BY d.department_id, d.department_name, d.location
              ORDER BY employee_count DESC`,
        description: "Comprehensive department overview"
      },

      {
        patterns: [
          /employees?\s+hired\s+(?:in\s+)?(?:last\s+)?(\d+)\s+(?:months?|years?)/i,
          /recent\s+hires/i,
          /new\s+employees/i
        ],
        sql: (matches) => {
          const period = matches && matches[1] ? parseInt(matches[1]) : 12;
          return `SELECT first_name, last_name, position, department_name, hire_date
                  FROM employees e
                  JOIN departments d ON e.department_id = d.department_id
                  WHERE hire_date >= date('now', '-${period} months')
                  ORDER BY hire_date DESC`;
        },
        description: "Recently hired employees"
      }
    ];
  }

  async translateAndExecute(naturalLanguageQuery) {
    try {
      // Find matching template
      const result = this.findMatchingTemplate(naturalLanguageQuery);
      
      if (!result.matched) {
        return {
          success: false,
          error: "I couldn't understand that query. Try asking about employees, sales, products, or departments.",
          suggestions: this.getSuggestions()
        };
      }

      // Execute the SQL query
      const queryResult = await this.executeQuery(result.sql);
      
      return {
        success: true,
        naturalLanguageQuery,
        sql: result.sql,
        description: result.description,
        results: queryResult.rows,
        rowCount: queryResult.rows.length,
        columns: queryResult.columns
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        naturalLanguageQuery,
        sql: result?.sql
      };
    }
  }

  findMatchingTemplate(query) {
    const normalizedQuery = query.toLowerCase().trim();

    for (const template of this.templates) {
      for (const pattern of template.patterns) {
        const match = normalizedQuery.match(pattern);
        if (match) {
          // Generate SQL based on match
          const sql = typeof template.sql === 'function' 
            ? template.sql(match) 
            : template.sql;
          
          return {
            matched: true,
            sql,
            description: template.description,
            pattern: pattern.source
          };
        }
      }
    }

    return { matched: false };
  }

  executeQuery(sql) {
    return new Promise((resolve, reject) => {
      const db = this.dbSetup.getDatabase();
      
      if (!db) {
        reject(new Error('Database not initialized'));
        return;
      }
      
      db.all(sql, [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          // Extract column names
          const columns = rows.length > 0 ? Object.keys(rows[0]) : [];
          
          resolve({
            rows,
            columns
          });
        }
      });
    });
  }

  getSuggestions() {
    return [
      "Show me all employees",
      "Who works in engineering?",
      "Show me the highest paid employees",
      "What is the average salary by department?",
      "What are the total sales?",
      "Show me monthly sales",
      "What are the top selling products?",
      "Show me sales by employee",
      "Sales of Furniture products",
      "Revenue from Electronics type",
      "Sales of Laptop Pro 15 on 2023-03-15",
      "Products priced between $50 and $500",
      "Employees with salary above $100000",
      "Sales to Acme Corp",
      "What did TechStart Inc buy?"
    ];
  }

  // Get database schema for reference
  async getSchema() {
    const schemaQuery = `
      SELECT name as table_name
      FROM sqlite_master
      WHERE type='table' 
      AND name NOT LIKE 'sqlite_%'
      ORDER BY name`;
    
    const tables = await this.executeQuery(schemaQuery);
    const schema = {};

    for (const table of tables.rows) {
      const columnsQuery = `PRAGMA table_info(${table.table_name})`;
      const columns = await this.executeQuery(columnsQuery);
      schema[table.table_name] = columns.rows.map(col => ({
        name: col.name,
        type: col.type,
        notNull: col.notnull === 1,
        primaryKey: col.pk === 1
      }));
    }

    return schema;
  }
}

module.exports = NL2SQLEngine;