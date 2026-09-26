from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials
import io
from googleapiclient.http import MediaIoBaseDownload

def get_drive_service(access_token: str):
    creds = Credentials(token=access_token)
    return build('drive', 'v3', credentials=creds)

def get_file_metadata(access_token: str, file_id: str) -> dict:
    service = get_drive_service(access_token)
    file = service.files().get(
        fileId=file_id, 
        fields="name, mimeType, size, webViewLink, thumbnailLink"
    ).execute()
    return file

def download_file_content(access_token: str, file_id: str) -> bytes:
    service = get_drive_service(access_token)
    request = service.files().get_media(fileId=file_id)
    fh = io.BytesIO()
    downloader = MediaIoBaseDownload(fh, request)
    done = False
    while done is False:
        status, done = downloader.next_chunk()
    return fh.getvalue()

def export_google_doc(access_token: str, file_id: str, mime_type: str = "application/pdf") -> bytes:
    service = get_drive_service(access_token)
    request = service.files().export_media(fileId=file_id, mimeType=mime_type)
    fh = io.BytesIO()
    downloader = MediaIoBaseDownload(fh, request)
    done = False
    while done is False:
        status, done = downloader.next_chunk()
    return fh.getvalue()
