# app.py
from flask import Flask
import os

app = Flask(__name__)

@app.route('/')
def home():
    api_key = os.getenv('API_KEY')
    return f'<h1>Your API Key is: {api_key}</h1>'

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)