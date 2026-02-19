"""
===============================================================================
STORAGE LAYER (Layer 1) - File Storage Abstraction
===============================================================================
Supports: Cloudflare R2, AWS S3, MinIO (local dev)
===============================================================================
"""
import hashlib
import io
import mimetypes
import os
from typing import BinaryIO, Optional, Tuple
from uuid import uuid4

import boto3
from botocore.config import Config
from botocore.exceptions import ClientError


class StorageService:
    """
    S3-compatible storage service for file operations.
    Works with R2, S3, MinIO, and other S3-compatible services.
    """
    
    def __init__(
        self,
        endpoint_url: Optional[str] = None,
        access_key: Optional[str] = None,
        secret_key: Optional[str] = None,
        region: str = "us-east-1",
        bucket: Optional[str] = None,
    ):
        self.endpoint_url = endpoint_url or os.getenv("STORAGE_ENDPOINT", "http://localhost:9000")
        self.access_key = access_key or os.getenv("STORAGE_ACCESS_KEY", "minioadmin")
        self.secret_key = secret_key or os.getenv("STORAGE_SECRET_KEY", "minioadmin")
        self.region = region or os.getenv("STORAGE_REGION", "us-east-1")
        self.bucket = bucket or os.getenv("STORAGE_BUCKET", "investments")
        
        # Configure boto3 client
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
        
        self._ensure_bucket_exists()
    
    def _ensure_bucket_exists(self):
        """Create bucket if it doesn't exist."""
        try:
            self.client.head_bucket(Bucket=self.bucket)
        except ClientError as e:
            error_code = e.response.get('Error', {}).get('Code', 'Unknown')
            if error_code in ('404', 'NoSuchBucket'):
                self.client.create_bucket(
                    Bucket=self.bucket,
                    CreateBucketConfiguration={
                        'LocationConstraint': self.region
                    } if self.region != 'us-east-1' else {}
                )
                print(f"Created bucket: {self.bucket}")
            else:
                raise
    
    def generate_storage_key(
        self,
        original_filename: str,
        investment_id: Optional[str] = None,
        prefix: str = "uploads"
    ) -> str:
        """
        Generate a structured storage key for a file.
        Format: {prefix}/{investment_id?}/{uuid}-{safe_filename}
        """
        # Generate unique ID
        file_uuid = str(uuid4())[:8]
        
        # Clean filename
        safe_filename = original_filename.replace(" ", "_").lower()
        safe_filename = "".join(c for c in safe_filename if c.isalnum() or c in '._-')
        
        # Build path
        parts = [prefix]
        if investment_id:
            parts.append(str(investment_id))
        parts.append(f"{file_uuid}-{safe_filename}")
        
        return "/".join(parts)
    
    def generate_upload_url(
        self,
        storage_key: str,
        content_type: str,
        expires_in: int = 300
    ) -> str:
        """
        Generate a pre-signed URL for direct upload.
        Phone uploads directly to storage - no file passes through API.
        """
        try:
            url = self.client.generate_presigned_url(
                'put_object',
                Params={
                    'Bucket': self.bucket,
                    'Key': storage_key,
                    'ContentType': content_type,
                },
                ExpiresIn=expires_in
            )
            return url
        except ClientError as e:
            raise Exception(f"Failed to generate upload URL: {e}")
    
    def generate_download_url(
        self,
        storage_key: str,
        expires_in: int = 3600,
        filename: Optional[str] = None
    ) -> str:
        """Generate a pre-signed URL for downloading a file."""
        params = {
            'Bucket': self.bucket,
            'Key': storage_key,
        }
        
        if filename:
            params['ResponseContentDisposition'] = f'attachment; filename="{filename}"'
        
        try:
            url = self.client.generate_presigned_url(
                'get_object',
                Params=params,
                ExpiresIn=expires_in
            )
            return url
        except ClientError as e:
            raise Exception(f"Failed to generate download URL: {e}")
    
    def upload_file(
        self,
        file_obj: BinaryIO,
        storage_key: str,
        content_type: Optional[str] = None
    ) -> dict:
        """
        Upload a file directly (for server-side uploads).
        Most uploads should use pre-signed URLs instead.
        """
        if content_type is None:
            content_type = mimetypes.guess_type(storage_key)[0] or 'application/octet-stream'
        
        extra_args = {
            'ContentType': content_type,
        }
        
        # Calculate file hash for deduplication
        file_obj.seek(0)
        file_hash = hashlib.sha256(file_obj.read()).hexdigest()
        file_obj.seek(0)
        
        try:
            self.client.upload_fileobj(
                file_obj,
                self.bucket,
                storage_key,
                ExtraArgs=extra_args
            )
            
            # Get file metadata
            response = self.client.head_object(Bucket=self.bucket, Key=storage_key)
            
            return {
                'storage_key': storage_key,
                'storage_bucket': self.bucket,
                'file_hash': file_hash,
                'file_size': response['ContentLength'],
                'etag': response['ETag'].strip('"'),
            }
        except ClientError as e:
            raise Exception(f"Failed to upload file: {e}")
    
    def download_file(self, storage_key: str) -> Tuple[bytes, str]:
        """Download a file to memory."""
        try:
            response = self.client.get_object(Bucket=self.bucket, Key=storage_key)
            content = response['Body'].read()
            content_type = response.get('ContentType', 'application/octet-stream')
            return content, content_type
        except ClientError as e:
            raise Exception(f"Failed to download file: {e}")
    
    def delete_file(self, storage_key: str) -> bool:
        """Delete a file from storage."""
        try:
            self.client.delete_object(Bucket=self.bucket, Key=storage_key)
            return True
        except ClientError as e:
            raise Exception(f"Failed to delete file: {e}")
    
    def file_exists(self, storage_key: str) -> bool:
        """Check if a file exists in storage."""
        try:
            self.client.head_object(Bucket=self.bucket, Key=storage_key)
            return True
        except ClientError as e:
            if e.response['Error']['Code'] == '404':
                return False
            raise
    
    def get_file_metadata(self, storage_key: str) -> dict:
        """Get metadata for a file without downloading it."""
        try:
            response = self.client.head_object(Bucket=self.bucket, Key=storage_key)
            return {
                'size': response['ContentLength'],
                'content_type': response.get('ContentType', 'application/octet-stream'),
                'last_modified': response['LastModified'],
                'etag': response['ETag'].strip('"'),
            }
        except ClientError as e:
            raise Exception(f"Failed to get file metadata: {e}")
    
    def list_files(
        self,
        prefix: Optional[str] = None,
        max_keys: int = 1000
    ) -> list:
        """List files in the bucket with optional prefix filter."""
        try:
            params = {
                'Bucket': self.bucket,
                'MaxKeys': max_keys,
            }
            if prefix:
                params['Prefix'] = prefix
            
            response = self.client.list_objects_v2(**params)
            
            files = []
            for obj in response.get('Contents', []):
                files.append({
                    'key': obj['Key'],
                    'size': obj['Size'],
                    'last_modified': obj['LastModified'],
                    'etag': obj['ETag'].strip('"'),
                })
            
            return files
        except ClientError as e:
            raise Exception(f"Failed to list files: {e}")


# Global storage instance (singleton)
_storage_instance: Optional[StorageService] = None


def get_storage_service() -> StorageService:
    """Get or create the global storage service instance."""
    global _storage_instance
    if _storage_instance is None:
        _storage_instance = StorageService()
    return _storage_instance
