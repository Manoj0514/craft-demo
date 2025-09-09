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
    region = os.getenv('AWS_REGION')
    az = os.getenv('AWS_AVAILABILITY_ZONE')
    return f'''
    <html>
        <head>
            <title>Flask App</title>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 20px; }}
                h1 {{ color: #333; }}
                button {{ padding: 10px 20px; font-size: 16px; }}
                #api-key {{ display: none; margin-top: 20px; font-weight: bold; }}
            </style>
            <script>
                function toggleApiKey() {{
                    var apiKeyDiv = document.getElementById('api-key');
                    apiKeyDiv.style.display = apiKeyDiv.style.display === 'none' ? 'block' : 'none';
                }}
            </script>
        </head>
        <body>
            <h1>Flask app is running in {az} availability zone.</h1>
            <button onclick="toggleApiKey()">Show API Key</button>
            <div id="api-key">API Key: {api_key}</div>
        </body>
    </html>
    '''

# Entry point for running the application and run the Flask application on host 0.0.0.0 and port 5000
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)