import re
import math
from database import get_db_connection

def get_menu():
    """Fetches formatted menu from DB"""
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("SELECT name, price, description FROM menu WHERE available=1")
    items = c.fetchall()
    conn.close()
    
    if not items:
        return "Our menu is currently empty. Please check back later!"
        
    menu_str = "Here is our coffee menu:\\n"
    for item in items:
        menu_str += f"- {item['name']}: ${item['price']:.2f}\\n"
    return menu_str

def get_coffee_details(coffee_name):
    """Fetches details of a specific coffee from DB"""
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("SELECT name, price, description FROM menu WHERE name LIKE ? COLLATE NOCASE", (f"%{coffee_name}%",))
    item = c.fetchone()
    conn.close()
    
    if item:
        return f"{item['name']} costs ${item['price']:.2f}. {item['description']}"
    return f"Sorry, I couldn't find any information on '{coffee_name}'."

def get_bot_response(user_message):
    message = user_message.lower().strip()
    
    # Greetings
    if re.search(r"\\b(hi|hello|hey|greetings)\\b", message):
        return "Hello! Welcome to our Coffee Cafe. How can I help you today? Type '/menu' to see our coffees."
    
    # Menu request
    if "/menu" in message or "show menu" in message or "what do you have" in message:
        return get_menu()
    
    # Check for specific price inquiries (e.g., "price of latte", "how much is espresso")
    price_match = re.search(r"(?:price of|how much is)\\s+([a-z\\s]+)", message)
    if price_match:
        coffee_name = price_match.group(1).strip()
        # Clean up some common words like 'a' or 'an'
        coffee_name = re.sub(r"\\b(?:a|an|the)\\b", "", coffee_name).strip()
        return get_coffee_details(coffee_name)
    
    # Details check ("tell me about latte")
    details_match = re.search(r"(?:tell me about|what is|details for)\\s+([a-z\\s]+)", message)
    if details_match:
        coffee_name = details_match.group(1).strip()
        coffee_name = re.sub(r"\\b(?:a|an|the)\\b", "", coffee_name).strip()
        return get_coffee_details(coffee_name)
        
    # Check if they just mentioned a coffee name (roughly)
    common_coffees = ["espresso", "cappuccino", "latte", "americano", "mocha", "iced coffee"]
    for coffee in common_coffees:
        if coffee in message:
            return get_coffee_details(coffee)

    # Ordering help
    if "order" in message or "buy" in message:
        return "You can place an order by navigating to our Menu page and adding items to your cart."
    
    # Fallback
    return "I'm sorry, I didn't quite catch that. You can ask me for the '/menu', about specific coffee prices, or just say 'hi'!"
