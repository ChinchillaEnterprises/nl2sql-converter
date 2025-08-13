# Dynamic Parameter Extraction in NL2SQL

This document explains how the system extracts dynamic parameters from natural language queries.

## 🎯 Overview

The NL2SQL engine can extract variable values like:
- Product names
- Customer names
- Dates (single date or date ranges)
- Price ranges
- Salary thresholds
- Categories
- Any text-based entity

## 📋 Dynamic Query Examples

### 1. Product Sales with Specific Date

**Natural Language Variations:**
- "Sales of Laptop Pro 15 on 2023-03-15"
- "Show sales of Wireless Mouse on 2023-04-05"
- "Sales of 'Office Chair' on 2023-02-10"

**Pattern:**
```javascript
/sales\s+(?:of\s+|for\s+)?(?:product\s+)?["']?([^"']+?)["']?\s+(?:on|in|during)\s+(\d{4}-\d{2}-\d{2})/i
```

**Extracted Parameters:**
- `matches[1]` = Product name (e.g., "Laptop Pro 15")
- `matches[2]` = Date (e.g., "2023-03-15")

**Generated SQL:**
```sql
SELECT p.product_name, s.sale_date, s.quantity, s.total_amount,
       c.customer_name, e.first_name || ' ' || e.last_name as sold_by
FROM sales s
JOIN products p ON s.product_id = p.product_id
JOIN customers c ON s.customer_id = c.customer_id
JOIN employees e ON s.employee_id = e.employee_id
WHERE LOWER(p.product_name) LIKE LOWER('%Laptop Pro 15%')
AND date(s.sale_date) = '2023-03-15'
ORDER BY s.sale_date
```

### 2. Product Sales with Date Range

**Natural Language Variations:**
- "Sales of USB-C Hub between 2023-01-01 and 2023-03-31"
- "Show sales of Monitor 27\" from 2023-02-01 to 2023-02-28"

**Pattern:**
```javascript
/sales\s+(?:of\s+|for\s+)?(?:product\s+)?["']?([^"']+?)["']?\s+(?:between|from)\s+(\d{4}-\d{2}-\d{2})\s+(?:to|and)\s+(\d{4}-\d{2}-\d{2})/i
```

**Extracted Parameters:**
- `matches[1]` = Product name
- `matches[2]` = Start date
- `matches[3]` = End date

### 3. Product Sales Summary

**Natural Language Variations:**
- "How many Office Chair were sold?"
- "Sales of Keyboard Mechanical"
- "Show me sales of 'Desk Lamp' in 2023-02"

**Pattern:**
```javascript
/sales\s+(?:of\s+|for\s+)?(?:product\s+)?["']?([^"']+?)["']?(?:\s+in\s+(\d{4}-\d{2}))?/i
```

**Dynamic Behavior:**
- Extracts product name
- Optionally extracts year-month for filtering
- If no date provided, shows all-time sales

### 4. Customer-Specific Sales

**Natural Language Variations:**
- "Sales to Acme Corp"
- "What did TechStart Inc buy?"
- "Show purchases by Global Ventures"

**Pattern:**
```javascript
/sales\s+to\s+(?:customer\s+)?["']?([^"']+?)["']?/i
```

**Generated SQL:**
```sql
SELECT c.customer_name, p.product_name, s.sale_date,
       s.quantity, s.total_amount
FROM sales s
JOIN customers c ON s.customer_id = c.customer_id
JOIN products p ON s.product_id = p.product_id
WHERE LOWER(c.customer_name) LIKE LOWER('%Acme Corp%')
ORDER BY s.sale_date DESC
```

### 5. Price Range Queries

**Natural Language Variations:**
- "Products priced between $50 and $500"
- "Products costing between 20 and 100"
- "Products from $100 to $1000"

**Pattern:**
```javascript
/products?\s+(?:priced\s+)?(?:between|from)\s+\$?(\d+(?:\.\d{2})?)\s+(?:to|and)\s+\$?(\d+(?:\.\d{2})?)/i
```

**Extracted Parameters:**
- `matches[1]` = Minimum price
- `matches[2]` = Maximum price

### 6. Salary Threshold Queries

**Natural Language Variations:**
- "Employees with salary above $100000"
- "Who earns more than $90000?"
- "Employees earning over 75000"

**Pattern:**
```javascript
/employees?\s+(?:with\s+)?salary\s+(?:above|over|greater\s+than)\s+\$?(\d+)/i
```

### 7. Category-Based Revenue

**Natural Language Variations:**
- "Revenue by Electronics category"
- "Sales of Furniture products"
- "Revenue from Electronics type"

**Pattern:**
```javascript
/revenue\s+(?:by|from)\s+["']?([^"']+?)["']?\s+(?:category|type)/i
```

## 🔧 Pattern Matching Techniques

### 1. Optional Components
- `(?:of\s+|for\s+)?` - Matches "of" or "for" optionally
- `["']?` - Optional quotes around values

### 2. Flexible Whitespace
- `\s+` - Matches one or more spaces
- Handles variations in spacing

### 3. Case Insensitive
- `/i` flag makes patterns case-insensitive
- `LOWER()` in SQL for comparison

### 4. Non-Greedy Matching
- `([^"']+?)` - Captures text but stops at quotes
- Prevents over-matching

### 5. Alternative Keywords
- `(?:on|in|during)` - Matches any of these words
- `(?:between|from)` - Either "between" or "from"

## 📊 Benefits of Dynamic Parameters

1. **Flexibility**: Users can query any product, customer, or date without predefined options
2. **Natural Language**: Supports various phrasings for the same query
3. **Scalability**: Works with any data values in the database
4. **User-Friendly**: No need to remember exact syntax

## 🚀 Testing Dynamic Queries

Try these queries in the application:

1. **Specific Product + Date**:
   - "Sales of Laptop Pro 15 on 2023-01-15"
   - "Show me sales of Wireless Mouse on 2023-02-20"

2. **Product + Date Range**:
   - "Sales of Office Chair between 2023-01-01 and 2023-03-31"
   - "USB-C Hub sales from 2023-02-01 to 2023-02-28"

3. **Customer Purchases**:
   - "What did Acme Corp buy?"
   - "Sales to Innovation Labs"

4. **Price Filtering**:
   - "Products between $50 and $200"
   - "Show me products priced from $100 to $500"

5. **Salary Queries**:
   - "Who earns more than $100000?"
   - "Employees with salary above $85000"

## 🔮 Future Enhancements

1. **Relative Dates**: "Sales in the last 30 days"
2. **Multiple Products**: "Sales of Laptop or Monitor"
3. **Fuzzy Matching**: Handle typos in product/customer names
4. **Aggregation Periods**: "Weekly sales of Laptop"
5. **Complex Conditions**: "Sales of products over $100 to customers in USA"

This dynamic parameter extraction makes the NL2SQL system truly flexible and user-friendly!