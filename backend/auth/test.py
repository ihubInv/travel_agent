# import smtplib
# from email.mime.multipart import MIMEMultipart
# from email.mime.text import MIMEText
# import logging

# # Configure logging
# logging.basicConfig(level=logging.DEBUG)
# logger = logging.getLogger(__name__)

# def send_test_email():
#     try:
#         sender_email = "rksakalni90@gmail.com"
#         # Use App Password instead of regular password
#         sender_password = "goqgoalpingcrfvv"  # This should be your App Password
#         receiver_emails = ["faryadk311@gmail.com"]

#         # Create message
#         msg = MIMEMultipart('alternative')
#         msg['Subject'] = "Test mail"
#         msg['From'] = sender_email
#         msg['To'] = ", ".join(receiver_emails)

#         # HTML content
#         html = """
#             <h1>Hello world</h1>
#             <p>This is a test email from your application.</p>
#         """
#         msg.attach(MIMEText(html, 'html'))

#         # Connect to Gmail's SMTP server
#         logger.info("Connecting to Gmail SMTP server...")
#         server = smtplib.SMTP_SSL('smtp.gmail.com', 465)
#         server.login(sender_email, sender_password)
#         logger.info("Successfully logged in to Gmail")

#         # Send email
#         logger.info(f"Sending email to {receiver_emails}")
#         server.sendmail(sender_email, receiver_emails, msg.as_string())
#         logger.info("Email sent successfully")

#         # Quit server
#         server.quit()
#         logger.info("Disconnected from Gmail SMTP server")
        
#         return True, "Email sent successfully"
        
#     except smtplib.SMTPAuthenticationError:
#         logger.error("Authentication failed. Please check your email credentials and ensure you're using an App Password.")
#         return False, "Authentication failed. Please check your email credentials."
#     except smtplib.SMTPException as e:
#         logger.error(f"SMTP error occurred: {str(e)}")
#         return False, f"SMTP error: {str(e)}"
#     except Exception as e:
#         logger.error(f"An unexpected error occurred: {str(e)}")
#         return False, f"Error: {str(e)}"

# if __name__ == "__main__":
#     success, message = send_test_email()
#     print(f"Success: {success}")
#     print(f"Message: {message}")




from flask import  request, jsonify, Blueprint,render_template_string

import os.path
import base64
from email.mime.text import MIMEText
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from dotenv import load_dotenv
import logging

load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))
logger = logging.getLogger(__name__)
logger.info(f"Loaded MAIL_USERNAME: {os.getenv('MAIL_USERNAME')}")
# If modifying these SCOPES, delete token.json
SCOPES = ['https://www.googleapis.com/auth/gmail.send']

def gmail_authenticate():
    creds = None
    if os.path.exists('token.json'):
        creds = Credentials.from_authorized_user_file('token.json', SCOPES)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file('credentials.json', SCOPES)
            creds = flow.run_local_server(port=0)
        with open('token.json', 'w') as token:
            token.write(creds.to_json())
    return build('gmail', 'v1', credentials=creds)

# def send_message(service,, to, subject, message_text):
#     message = MIMEText(message_text, "html")
#     message['to'] = to
#     message['from'] = sender
#     message['subject'] = subject
#     raw = base64.urlsafe_b64encode(message.as_bytes()).decode()
#     message = {'raw': raw}
#     sent = service.users().messages().send(userId="me", body=message).execute()
#     print(f"Message Id: {sent['id']}")
#     return sent






def send_message(service,to, subject, message_body):
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


# Usage
if __name__ == "__main__":
    service = gmail_authenticate()
    send_message(
        service,
        sender="rksakalni90@gmail.com",
        to="ramanuj@ihubiitmandi.in",
        subject="✅ Gmail API Email",
        message_text="<h1>Hello from Gmail API</h1><p>This email uses OAuth 2.0!</p>"
    )
