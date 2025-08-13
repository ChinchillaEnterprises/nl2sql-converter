const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class DatabaseSetup {
  constructor() {
    // Use in-memory database for AWS Amplify deployment
    this.dbPath = ':memory:';
    this.db = null;
  }

  async setup() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          reject(err);
        } else {
          console.log('Connected to SQLite database.');
          this.createTables(this.db)
            .then(() => this.insertSampleData(this.db))
            .then(() => {
              console.log('Database setup complete!');
              resolve(this.db);
            })
            .catch(reject);
        }
      });
    });
  }

  async createTables(db) {
    const tables = [
      // Employees table
      `CREATE TABLE IF NOT EXISTS employees (
        employee_id INTEGER PRIMARY KEY AUTOINCREMENT,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        email TEXT UNIQUE,
        department_id INTEGER,
        position TEXT,
        salary DECIMAL(10,2),
        hire_date DATE,
        manager_id INTEGER,
        FOREIGN KEY (department_id) REFERENCES departments(department_id),
        FOREIGN KEY (manager_id) REFERENCES employees(employee_id)
      )`,

      // Departments table
      `CREATE TABLE IF NOT EXISTS departments (
        department_id INTEGER PRIMARY KEY AUTOINCREMENT,
        department_name TEXT NOT NULL,
        location TEXT,
        budget DECIMAL(12,2)
      )`,

      // Products table
      `CREATE TABLE IF NOT EXISTS products (
        product_id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_name TEXT NOT NULL,
        category TEXT,
        price DECIMAL(10,2),
        stock_quantity INTEGER,
        supplier_id INTEGER,
        FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id)
      )`,

      // Sales table
      `CREATE TABLE IF NOT EXISTS sales (
        sale_id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER,
        employee_id INTEGER,
        customer_id INTEGER,
        sale_date DATE,
        quantity INTEGER,
        total_amount DECIMAL(10,2),
        FOREIGN KEY (product_id) REFERENCES products(product_id),
        FOREIGN KEY (employee_id) REFERENCES employees(employee_id),
        FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
      )`,

      // Customers table
      `CREATE TABLE IF NOT EXISTS customers (
        customer_id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        city TEXT,
        country TEXT,
        registration_date DATE
      )`,

      // Suppliers table
      `CREATE TABLE IF NOT EXISTS suppliers (
        supplier_id INTEGER PRIMARY KEY AUTOINCREMENT,
        supplier_name TEXT NOT NULL,
        contact_name TEXT,
        phone TEXT,
        city TEXT,
        country TEXT
      )`,

      // Projects table
      `CREATE TABLE IF NOT EXISTS projects (
        project_id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_name TEXT NOT NULL,
        department_id INTEGER,
        start_date DATE,
        end_date DATE,
        budget DECIMAL(12,2),
        status TEXT,
        FOREIGN KEY (department_id) REFERENCES departments(department_id)
      )`,

      // Employee_Projects junction table
      `CREATE TABLE IF NOT EXISTS employee_projects (
        employee_id INTEGER,
        project_id INTEGER,
        role TEXT,
        hours_allocated INTEGER,
        PRIMARY KEY (employee_id, project_id),
        FOREIGN KEY (employee_id) REFERENCES employees(employee_id),
        FOREIGN KEY (project_id) REFERENCES projects(project_id)
      )`
    ];

    for (const table of tables) {
      await this.runQuery(db, table);
    }
    console.log('All tables created successfully.');
  }

  async insertSampleData(db) {
    // Clear existing data
    const clearTables = [
      'DELETE FROM employee_projects',
      'DELETE FROM sales',
      'DELETE FROM projects',
      'DELETE FROM employees',
      'DELETE FROM products',
      'DELETE FROM customers',
      'DELETE FROM suppliers',
      'DELETE FROM departments'
    ];

    for (const query of clearTables) {
      await this.runQuery(db, query);
    }

    // Insert Departments
    const departments = [
      `INSERT INTO departments (department_id, department_name, location, budget) VALUES 
        (1, 'Engineering', 'San Francisco', 2500000),
        (2, 'Sales', 'New York', 1500000),
        (3, 'Marketing', 'Los Angeles', 1000000),
        (4, 'HR', 'Chicago', 800000),
        (5, 'Finance', 'Boston', 1200000)`
    ];

    // Insert Employees
    const employees = [
      `INSERT INTO employees (employee_id, first_name, last_name, email, department_id, position, salary, hire_date, manager_id) VALUES 
        (1, 'John', 'Smith', 'john.smith@company.com', 1, 'Senior Engineer', 120000, '2020-01-15', NULL),
        (2, 'Jane', 'Doe', 'jane.doe@company.com', 1, 'Software Engineer', 95000, '2021-03-20', 1),
        (3, 'Mike', 'Johnson', 'mike.johnson@company.com', 2, 'Sales Manager', 110000, '2019-07-10', NULL),
        (4, 'Sarah', 'Williams', 'sarah.williams@company.com', 2, 'Sales Rep', 75000, '2021-11-05', 3),
        (5, 'Robert', 'Brown', 'robert.brown@company.com', 3, 'Marketing Director', 130000, '2018-05-12', NULL),
        (6, 'Emily', 'Davis', 'emily.davis@company.com', 3, 'Marketing Specialist', 65000, '2022-02-28', 5),
        (7, 'David', 'Miller', 'david.miller@company.com', 4, 'HR Manager', 90000, '2020-09-15', NULL),
        (8, 'Lisa', 'Wilson', 'lisa.wilson@company.com', 5, 'Finance Director', 140000, '2017-03-22', NULL),
        (9, 'Tom', 'Anderson', 'tom.anderson@company.com', 1, 'Junior Developer', 70000, '2022-06-01', 2),
        (10, 'Anna', 'Martinez', 'anna.martinez@company.com', 2, 'Sales Rep', 72000, '2021-08-17', 3)`
    ];

    // Insert Suppliers
    const suppliers = [
      `INSERT INTO suppliers (supplier_id, supplier_name, contact_name, phone, city, country) VALUES 
        (1, 'Tech Supplies Inc', 'James Wilson', '555-0101', 'Seattle', 'USA'),
        (2, 'Office World', 'Mary Johnson', '555-0102', 'Portland', 'USA'),
        (3, 'Global Electronics', 'Chen Wei', '555-0103', 'Shanghai', 'China'),
        (4, 'Premium Parts Co', 'Hans Mueller', '555-0104', 'Berlin', 'Germany')`
    ];

    // Insert Products
    const products = [
      `INSERT INTO products (product_id, product_name, category, price, stock_quantity, supplier_id) VALUES 
        (1, 'Laptop Pro 15', 'Electronics', 1299.99, 50, 1),
        (2, 'Wireless Mouse', 'Electronics', 29.99, 200, 1),
        (3, 'Office Chair', 'Furniture', 299.99, 75, 2),
        (4, 'Standing Desk', 'Furniture', 599.99, 30, 2),
        (5, 'USB-C Hub', 'Electronics', 49.99, 150, 3),
        (6, 'Monitor 27"', 'Electronics', 399.99, 60, 3),
        (7, 'Keyboard Mechanical', 'Electronics', 129.99, 100, 1),
        (8, 'Webcam HD', 'Electronics', 79.99, 80, 3),
        (9, 'Desk Lamp', 'Furniture', 39.99, 120, 2),
        (10, 'Cable Set', 'Electronics', 19.99, 300, 4)`
    ];

    // Insert Customers
    const customers = [
      `INSERT INTO customers (customer_id, customer_name, email, phone, city, country, registration_date) VALUES 
        (1, 'Acme Corp', 'contact@acme.com', '555-1001', 'New York', 'USA', '2020-01-10'),
        (2, 'TechStart Inc', 'info@techstart.com', '555-1002', 'Austin', 'USA', '2020-03-15'),
        (3, 'Global Ventures', 'sales@globalv.com', '555-1003', 'London', 'UK', '2020-06-20'),
        (4, 'Innovation Labs', 'hello@innovlabs.com', '555-1004', 'Toronto', 'Canada', '2021-01-05'),
        (5, 'Digital Solutions', 'contact@digisol.com', '555-1005', 'Sydney', 'Australia', '2021-04-12'),
        (6, 'Future Systems', 'info@futuresys.com', '555-1006', 'Tokyo', 'Japan', '2021-07-18'),
        (7, 'Smart Tech Co', 'sales@smarttech.com', '555-1007', 'Seoul', 'South Korea', '2021-10-22'),
        (8, 'Data Dynamics', 'hello@datadyn.com', '555-1008', 'Mumbai', 'India', '2022-02-14'),
        (9, 'Cloud Nine Inc', 'contact@cloudnine.com', '555-1009', 'Singapore', 'Singapore', '2022-05-30'),
        (10, 'Quantum Corp', 'info@quantum.com', '555-1010', 'Berlin', 'Germany', '2022-08-25')`
    ];

    // Insert Sales
    const sales = [
      `INSERT INTO sales (product_id, employee_id, customer_id, sale_date, quantity, total_amount) VALUES 
        (1, 3, 1, '2023-01-15', 5, 6499.95),
        (2, 4, 2, '2023-01-20', 10, 299.90),
        (3, 3, 3, '2023-02-05', 3, 899.97),
        (4, 4, 4, '2023-02-10', 2, 1199.98),
        (5, 10, 5, '2023-02-15', 20, 999.80),
        (6, 3, 6, '2023-03-01', 4, 1599.96),
        (7, 4, 7, '2023-03-10', 8, 1039.92),
        (8, 10, 8, '2023-03-15', 6, 479.94),
        (1, 3, 9, '2023-04-01', 3, 3899.97),
        (2, 4, 10, '2023-04-05', 15, 449.85),
        (9, 10, 1, '2023-04-10', 10, 399.90),
        (10, 3, 2, '2023-04-15', 25, 499.75),
        (6, 4, 3, '2023-05-01', 5, 1999.95),
        (1, 10, 4, '2023-05-10', 2, 2599.98),
        (3, 3, 5, '2023-05-15', 4, 1199.96)`
    ];

    // Insert Projects
    const projects = [
      `INSERT INTO projects (project_id, project_name, department_id, start_date, end_date, budget, status) VALUES 
        (1, 'Website Redesign', 1, '2023-01-01', '2023-06-30', 150000, 'In Progress'),
        (2, 'Sales CRM Implementation', 2, '2023-02-01', '2023-08-31', 200000, 'In Progress'),
        (3, 'Marketing Campaign Q2', 3, '2023-04-01', '2023-06-30', 75000, 'Planning'),
        (4, 'Employee Training Program', 4, '2023-03-01', '2023-12-31', 50000, 'Active'),
        (5, 'Financial System Upgrade', 5, '2023-01-15', '2023-07-15', 180000, 'In Progress')`
    ];

    // Insert Employee_Projects
    const employeeProjects = [
      `INSERT INTO employee_projects (employee_id, project_id, role, hours_allocated) VALUES 
        (1, 1, 'Project Lead', 300),
        (2, 1, 'Developer', 400),
        (9, 1, 'Developer', 350),
        (3, 2, 'Project Manager', 200),
        (4, 2, 'Analyst', 300),
        (10, 2, 'Analyst', 250),
        (5, 3, 'Project Lead', 150),
        (6, 3, 'Coordinator', 200),
        (7, 4, 'Project Manager', 100),
        (8, 5, 'Project Lead', 250)`
    ];

    // Execute all insert statements
    const allInserts = [
      ...departments,
      ...employees,
      ...suppliers,
      ...products,
      ...customers,
      ...sales,
      ...projects,
      ...employeeProjects
    ];

    for (const query of allInserts) {
      await this.runQuery(db, query);
    }

    console.log('Sample data inserted successfully.');
  }

  runQuery(db, query) {
    return new Promise((resolve, reject) => {
      db.run(query, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  getDatabase() {
    return this.db;
  }
}

module.exports = DatabaseSetup;