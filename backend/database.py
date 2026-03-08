import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), 'db.sqlite')

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    c = conn.cursor()
    
    # Create menu table
    c.execute('''
        CREATE TABLE IF NOT EXISTS menu (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            price REAL NOT NULL,
            category TEXT,
            description TEXT,
            available BOOLEAN DEFAULT 1
        )
    ''')
    
    # Create orders table
    c.execute('''
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_name TEXT NOT NULL,
            customer_phone TEXT,
            items TEXT NOT NULL,  -- JSON string of items and quantities
            total_price REAL NOT NULL,
            order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            status TEXT DEFAULT 'Pending'
        )
    ''')
    
    # Check if menu is empty, and insert sample data
    c.execute("SELECT COUNT(*) FROM menu")
    if c.fetchone()[0] == 0:
        sample_menu = [
            ("Espresso", 3.00, "Hot Coffee", "Strong and bold shot of pure coffee.", True),
            ("Cappuccino", 4.50, "Hot Coffee", "Espresso with steamed milk and a deep layer of foam.", True),
            ("Latte", 4.00, "Hot Coffee", "Espresso mixed with steamed milk and a light layer of foam.", True),
            ("Americano", 3.50, "Hot Coffee", "Espresso diluted with hot water. Rich in flavor.", True),
            ("Mocha", 5.00, "Hot Coffee", "Espresso with chocolate, steamed milk, and whipped cream.", True),
            ("Iced Coffee", 4.25, "Cold Coffee", "Chilled brewed coffee served over ice.", True)
        ]
        c.executemany('''
            INSERT INTO menu (name, price, category, description, available)
            VALUES (?, ?, ?, ?, ?)
        ''', sample_menu)
    
    conn.commit()
    conn.close()

def get_menu_items():
    conn = get_db_connection()
    items = conn.execute('SELECT * FROM menu WHERE available = 1').fetchall()
    conn.close()
    return [dict(ix) for ix in items]

if __name__ == "__main__":
    init_db()
    print("Database initialized and sample data seeded.")
