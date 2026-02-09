# Quick script to create Google Calendar event
# Requires: pip install google-auth-oauthlib google-auth-httplib2 google-api-python-client

from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
import os.path
import pickle
from datetime import datetime, timedelta

# If modifying these scopes, delete the file token.pickle.
SCOPES = ['https://www.googleapis.com/auth/calendar']

def create_event():
    creds = None
    # The file token.pickle stores the user's access and refresh tokens
    if os.path.exists('token.pickle'):
        with open('token.pickle', 'rb') as token:
            creds = pickle.load(token)
    
    # If there are no (valid) credentials available, let the user log in.
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            print("Please run initial setup first to get credentials")
            return
    
    service = build('calendar', 'v3', credentials=creds)
    
    # Event details
    event = {
        'summary': 'Chris & Cindy Visit (Tentative)',
        'description': 'Friend Chris and wife Cindy visiting from out of town. Block time to hang out - dates are tentative.',
        'start': {
            'date': '2025-03-05',
            'timeZone': 'America/New_York',
        },
        'end': {
            'date': '2025-03-10',  # End date is exclusive, so March 10 means through March 9
            'timeZone': 'America/New_York',
        },
        'reminders': {
            'useDefault': False,
            'overrides': [
                {'method': 'email', 'minutes': 24 * 60 * 7},  # 1 week before
                {'method': 'popup', 'minutes': 24 * 60 * 2},  # 2 days before
            ],
        },
    }
    
    event = service.events().insert(calendarId='primary', body=event).execute()
    print(f'Event created: {event.get("htmlLink")}')

if __name__ == '__main__':
    create_event()
