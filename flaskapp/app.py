# Import necessary modules from Flask and the standard library
from flask import Flask
import os

# Create an instance of the Flask class
app = Flask(__name__)

# Define a route for the root URL
@app.route('/')
def home():
    # Retrieve the API_KEY environment variable and return it in the response
    api_key = os.getenv('API_KEY')
    return f'<h1>Here is the API KEY from secret manager: {api_key}</h1>'

# Entry point for running the application
if __name__ == '__main__':
    # Run the Flask application on host 0.0.0.0 and port 5000
    app.run(host='0.0.0.0', port=5000)