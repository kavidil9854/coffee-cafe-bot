from flask import Flask, jsonify, request
from flask_cors import CORS
import json
from database import get_db_connection, get_menu_items, init_db
from bot_logic import get_bot_response
import os

app = Flask(__name__)
# Enable CORS so frontend on different port/file can access
CORS(app)

# Ensure DB is initialized when app starts
if not os.path.exists(os.path.join(os.path.dirname(__file__), 'db.sqlite')):
    init_db()
else:
    # Just in case, init_db handles IF NOT EXISTS
    init_db()

@app.route('/api/menu', methods=['GET'])
def api_get_menu():
    """Fetch all menu items"""
    items = get_menu_items()
    return jsonify(items)

@app.route('/api/order', methods=['POST'])
def api_place_order():
    """Place an order"""
    data = request.json
    
    if not data or 'items' not in data or 'total_price' not in data:
        return jsonify({'error': 'Invalid order data'}), 400
        
    customer_name = data.get('customer_name', 'Guest')
    customer_phone = data.get('customer_phone', '')
    
    # items should be a JSON string or dict that we can serialize
    items_json = json.dumps(data['items'])
    total_price = data['total_price']
    
    conn = get_db_connection()
    c = conn.cursor()
    c.execute('''
        INSERT INTO orders (customer_name, customer_phone, items, total_price)
        VALUES (?, ?, ?, ?)
    ''', (customer_name, customer_phone, items_json, total_price))
    
    order_id = c.lastrowid
    conn.commit()
    conn.close()
    
    return jsonify({'message': 'Order placed successfully', 'order_id': order_id}), 201

@app.route('/api/chat', methods=['POST'])
def api_chat():
    """Talk to Chat Bot"""
    data = request.json
    if not data or 'message' not in data:
        return jsonify({'error': 'No message provided'}), 400
        
    user_message = data['message']
    bot_reply = get_bot_response(user_message)
    
    return jsonify({'reply': bot_reply})

if __name__ == '__main__':
    # Run the Flask app on default port 5000
    app.run(debug=True, port=5000)
