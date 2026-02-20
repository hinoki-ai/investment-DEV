"""Initial schema

Revision ID: 001
Revises: 
Create Date: 2024-01-01 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create enum types
    op.execute("""
        CREATE TYPE investmentcategory AS ENUM (
            'land', 'stocks', 'gold', 'crypto', 'real_estate', 'bonds', 'other'
        )
    """)
    
    op.execute("""
        CREATE TYPE filestatus AS ENUM (
            'pending', 'processing', 'completed', 'failed', 'archived'
        )
    """)
    
    op.execute("""
        CREATE TYPE jobtype AS ENUM (
            'document_analysis', 'valuation', 'ocr', 'summarization', 'custom'
        )
    """)
    
    op.execute("""
        CREATE TYPE jobstatus AS ENUM (
            'queued', 'running', 'completed', 'failed', 'cancelled'
        )
    """)
    
    op.execute("""
        CREATE TYPE documenttype AS ENUM (
            'deed', 'contract', 'receipt', 'photo', 'video', 'audio', 
            'survey', 'appraisal', 'tax_document', 'permit', 'correspondence',
            'financial_statement', 'legal', 'other'
        )
    """)
    
    op.execute("""
        CREATE TYPE investmentstatus AS ENUM (
            'active', 'sold', 'pending', 'under_contract'
        )
    """)
    
    # Create investments table
    op.create_table(
        'investments',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(500), nullable=False),
        sa.Column('category', sa.Enum('land', 'stocks', 'gold', 'crypto', 'real_estate', 'bonds', 'other', name='investmentcategory'), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('address', sa.Text(), nullable=True),
        sa.Column('city', sa.String(255), nullable=True),
        sa.Column('state', sa.String(255), nullable=True),
        sa.Column('country', sa.String(100), server_default='Brazil'),
        sa.Column('purchase_price', sa.Numeric(18, 2), nullable=True),
        sa.Column('purchase_currency', sa.String(3), server_default='BRL'),
        sa.Column('purchase_date', sa.Date(), nullable=True),
        sa.Column('current_value', sa.Numeric(18, 2), nullable=True),
        sa.Column('last_valuation_date', sa.Date(), nullable=True),
        sa.Column('land_area_m2', sa.Numeric(12, 2), nullable=True),
        sa.Column('land_area_hectares', sa.Numeric(10, 4), nullable=True),
        sa.Column('zoning_type', sa.String(100), nullable=True),
        sa.Column('ownership_percentage', sa.Numeric(5, 2), server_default='100.00'),
        sa.Column('co_owners', postgresql.ARRAY(sa.String()), server_default='{}'),
        sa.Column('status', sa.Enum('active', 'sold', 'pending', 'under_contract', name='investmentstatus'), server_default='active'),
        sa.Column('tags', postgresql.ARRAY(sa.String()), server_default='{}'),
        sa.Column('custom_metadata', postgresql.JSON(astext_type=sa.Text()), server_default='{}'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()),
        sa.Column('created_by', sa.String(255), nullable=True),
    )
    
    # Create file_registry table
    op.create_table(
        'file_registry',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('original_filename', sa.String(500), nullable=False),
        sa.Column('storage_key', sa.String(1000), nullable=False),
        sa.Column('storage_bucket', sa.String(255), nullable=False),
        sa.Column('file_size_bytes', sa.Integer(), nullable=True),
        sa.Column('mime_type', sa.String(100), nullable=True),
        sa.Column('file_hash', sa.String(64), nullable=True),
        sa.Column('uploaded_by', sa.String(255), nullable=True),
        sa.Column('uploaded_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('source_device', sa.String(50), nullable=True),
        sa.Column('status', sa.Enum('pending', 'processing', 'completed', 'failed', 'archived', name='filestatus'), server_default='pending'),
        sa.Column('investment_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('investments.id'), nullable=True),
        sa.Column('document_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('tags', postgresql.ARRAY(sa.String()), server_default='{}'),
        sa.Column('custom_metadata', postgresql.JSON(astext_type=sa.Text()), server_default='{}'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()),
        sa.Column('processed_at', sa.DateTime(timezone=True), nullable=True),
        sa.UniqueConstraint('storage_bucket', 'storage_key', name='unique_storage_key'),
    )
    
    # Create processing_jobs table
    op.create_table(
        'processing_jobs',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('job_type', sa.Enum('document_analysis', 'valuation', 'ocr', 'summarization', 'custom', name='jobtype'), nullable=False),
        sa.Column('status', sa.Enum('queued', 'running', 'completed', 'failed', 'cancelled', name='jobstatus'), server_default='queued'),
        sa.Column('priority', sa.Integer(), server_default='5'),
        sa.Column('file_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('file_registry.id'), nullable=False),
        sa.Column('investment_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('investments.id'), nullable=True),
        sa.Column('worker_id', sa.String(100), nullable=True),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('retry_count', sa.Integer(), server_default='0'),
        sa.Column('max_retries', sa.Integer(), server_default='3'),
        sa.Column('parameters', postgresql.JSON(astext_type=sa.Text()), server_default='{}'),
        sa.Column('result_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()),
        sa.Column('scheduled_at', sa.DateTime(timezone=True), nullable=True),
    )
    
    # Create analysis_results table
    op.create_table(
        'analysis_results',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('job_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('file_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('file_registry.id'), nullable=False),
        sa.Column('investment_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('investments.id'), nullable=True),
        sa.Column('analysis_type', sa.String(50), nullable=False),
        sa.Column('model_version', sa.String(100), nullable=True),
        sa.Column('raw_text', sa.Text(), nullable=True),
        sa.Column('structured_data', postgresql.JSON(astext_type=sa.Text()), server_default='{}'),
        sa.Column('summary', sa.Text(), nullable=True),
        sa.Column('extracted_entities', postgresql.JSON(astext_type=sa.Text()), server_default='{}'),
        sa.Column('extracted_dates', postgresql.JSON(astext_type=sa.Text()), server_default='{}'),
        sa.Column('extracted_amounts', postgresql.JSON(astext_type=sa.Text()), server_default='{}'),
        sa.Column('confidence_score', sa.Numeric(3, 2), nullable=True),
        sa.Column('quality_flags', postgresql.ARRAY(sa.String()), server_default='{}'),
        sa.Column('processing_time_ms', sa.Integer(), nullable=True),
        sa.Column('tokens_used', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    
    # Create documents table
    op.create_table(
        'documents',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('investment_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('investments.id'), nullable=False),
        sa.Column('file_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('file_registry.id'), nullable=False, unique=True),
        sa.Column('document_type', sa.Enum('deed', 'contract', 'receipt', 'photo', 'video', 'audio', 'survey', 'appraisal', 'tax_document', 'permit', 'correspondence', 'financial_statement', 'legal', 'other', name='documenttype'), nullable=False),
        sa.Column('title', sa.String(500), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('document_date', sa.Date(), nullable=True),
        sa.Column('is_key_document', sa.Boolean(), server_default='false'),
        sa.Column('tags', postgresql.ARRAY(sa.String()), server_default='{}'),
        sa.Column('custom_metadata', postgresql.JSON(astext_type=sa.Text()), server_default='{}'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()),
    )
    
    # Create valuation_history table
    op.create_table(
        'valuation_history',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('investment_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('investments.id'), nullable=False),
        sa.Column('valuation_date', sa.Date(), nullable=False),
        sa.Column('value', sa.Numeric(18, 2), nullable=False),
        sa.Column('currency', sa.String(3), server_default='BRL'),
        sa.Column('valuation_method', sa.String(100), nullable=True),
        sa.Column('valuer_name', sa.String(255), nullable=True),
        sa.Column('source_document_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('created_by', sa.String(255), nullable=True),
    )
    
    # Create activity_log table
    op.create_table(
        'activity_log',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('entity_type', sa.String(50), nullable=False),
        sa.Column('entity_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('action', sa.String(50), nullable=False),
        sa.Column('performed_by', sa.String(255), nullable=True),
        sa.Column('performed_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('old_values', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('new_values', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('ip_address', sa.String(45), nullable=True),
        sa.Column('user_agent', sa.Text(), nullable=True),
    )
    
    # Create alembic_version table is handled by alembic itself


def downgrade() -> None:
    # Drop tables in reverse order
    op.drop_table('activity_log')
    op.drop_table('valuation_history')
    op.drop_table('documents')
    op.drop_table('analysis_results')
    op.drop_table('processing_jobs')
    op.drop_table('file_registry')
    op.drop_table('investments')
    
    # Drop enum types
    op.execute('DROP TYPE investmentstatus')
    op.execute('DROP TYPE documenttype')
    op.execute('DROP TYPE jobstatus')
    op.execute('DROP TYPE jobtype')
    op.execute('DROP TYPE filestatus')
    op.execute('DROP TYPE investmentcategory')
