"""
===============================================================================
WORKER STORAGE LAYER - File download for processing
===============================================================================
"""
import hashlib
import os
import tempfile
from typing import Optional, Tuple

import boto3
from botocore.config import Config
from botocore.exceptions import ClientError


class WorkerStorage:
    """Storage service for the worker to download files."""
    
    def __init__(
        self,
        endpoint_url: Optional[str] = None,
        access_key: Optional[str] = None,
        secret_key: Optional[str] = None,
        region: str = "us-east-1",
        bucket: Optional[str] = None,
        temp_dir: str = "/app/temp"
    ):
        self.endpoint_url = endpoint_url or os.getenv("STORAGE_ENDPOINT", "http://localhost:9000")
        self.access_key = access_key or os.getenv("STORAGE_ACCESS_KEY", "minioadmin")
        self.secret_key = secret_key or os.getenv("STORAGE_SECRET_KEY", "minioadmin")
        self.region = region or os.getenv("STORAGE_REGION", "us-east-1")
        self.bucket = bucket or os.getenv("STORAGE_BUCKET", "investments")
        self.temp_dir = temp_dir
        
        # Ensure temp directory exists
        os.makedirs(self.temp_dir, exist_ok=True)
        
        boto_config = Config(
            signature_version='s3v4',
            retries={'max_attempts': 3, 'mode': 'standard'}
        )
        
        self.client = boto3.client(
            's3',
            endpoint_url=self.endpoint_url,
            aws_access_key_id=self.access_key,
            aws_secret_access_key=self.secret_key,
            region_name=self.region,
            config=boto_config
        )
    
    def download_file(self, storage_key: str, file_id: str) -> str:
        """
        Download a file to local temp directory.
        Returns the local file path.
        """
        # Get original filename from storage key
        original_filename = storage_key.split("/")[-1]
        
        # Create temp file path
        local_path = os.path.join(self.temp_dir, f"{file_id}_{original_filename}")
        
        try:
            self.client.download_file(self.bucket, storage_key, local_path)
            return local_path
        except ClientError as e:
            raise Exception(f"Failed to download file {storage_key}: {e}")
    
    def cleanup_file(self, local_path: str):
        """Remove downloaded file from temp directory."""
        try:
            if os.path.exists(local_path):
                os.remove(local_path)
        except Exception as e:
            print(f"Warning: Failed to cleanup file {local_path}: {e}")
    
    def get_file_metadata(self, storage_key: str) -> dict:
        """Get file metadata without downloading."""
        try:
            response = self.client.head_object(Bucket=self.bucket, Key=storage_key)
            return {
                'size': response['ContentLength'],
                'content_type': response.get('ContentType', 'application/octet-stream'),
                'last_modified': response['LastModified'],
            }
        except ClientError as e:
            raise Exception(f"Failed to get file metadata: {e}")


# Singleton instance
_storage_instance: Optional[WorkerStorage] = None


def get_storage() -> WorkerStorage:
    """Get or create the global storage instance."""
    global _storage_instance
    if _storage_instance is None:
        _storage_instance = WorkerStorage()
    return _storage_instance
