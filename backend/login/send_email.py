
from flask import  request, jsonify, Blueprint,render_template_string
import os.path
import base64
import logging
from email.mime.text import MIMEText
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from dotenv import load_dotenv


logger = logging.getLogger(__name__)

send_email_bp = Blueprint('send_email', __name__)

load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))
logger.info(f"Loaded MAIL_USERNAME: {os.getenv('MAIL_USERNAME')}")

# Gmail API scope
SCOPES = ['https://www.googleapis.com/auth/gmail.send']

print(f"secretes path{os.path.exists('credentials/token.json')}")
def gmail_authenticate():
    creds = None
    if os.path.exists('credentials/token.json'):
        
        creds = Credentials.from_authorized_user_file('credentials/token.json', SCOPES)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file('credentials/credentials.json', SCOPES)
            creds = flow.run_local_server(port=0)
        with open('credentials/token.json', 'w') as token:
            token.write(creds.to_json())
    return build('gmail', 'v1', credentials=creds)

# def send_email_via_gmail_api(to, subject, message_text):
#     service = gmail_authenticate()
#     message = MIMEText(message_text, "html")
#     message['to'] = to
#     message['from'] = os.getenv('MAIL_USERNAME')  # Update this if needed
#     message['subject'] = subject
#     raw = base64.urlsafe_b64encode(message.as_bytes()).decode()
#     message = {'raw': raw}
#     sent = service.users().messages().send(userId="me", body=message).execute()
#     return sent


def send_email_via_gmail_api(to, subject, message_body):
    service = gmail_authenticate()

    # Define the HTML template with inline CSS
    html_template = """
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: 'Arial', sans-serif;
          background-color: #f9f9f9;
          margin: 0;
          padding: 20px;
        }
        .container {
          background-color: #ffffff;
          border-radius: 8px;
          padding: 20px;
          max-width: 600px;
          margin: auto;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        h2 {
          color: #2a9d8f;
        }
        p {
          color: #333333;
        }
        .footer {
          margin-top: 20px;
          font-size: 12px;
          color: #999999;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>{{ subject }}</h2>
        <p>{{ message_body }}</p>
        <div class="footer">
          Flight Agent AI ✈️ – All rights reserved
        </div>
      </div>
    </body>
    </html>
    """

    # Render the template with variables
    rendered_html = render_template_string(html_template, subject=subject, message_body=message_body)

    # Build the MIMEText email
    message = MIMEText(rendered_html, "html")
    message['to'] =to
    message['from'] = os.getenv('MAIL_USERNAME')
    message['subject'] = subject

    raw = base64.urlsafe_b64encode(message.as_bytes()).decode()
    message = {'raw': raw}
    sent = service.users().messages().send(userId="me", body=message).execute()
    return sent





@send_email_bp.route('/send-email', methods=['POST'])
def send_email():
    data = request.get_json()
    
    # data = {
    #     "to": "faryadk311@gmail.com",
    #     "subject": "Flight Agent AI Test Email",
    #     "message": "This message will be replaced",
    #     "name": "Faryad"
    # },
        
    to = data.get("to")
    subject = data.get("subject")
    message = data.get("message")

    if not all([to, subject, message]):
        return jsonify({"error": "Missing required fields"}), 400

    try:
        result = send_email_via_gmail_api(to, subject, message)
        return jsonify({"success": True, "message_id": result["id"]}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


