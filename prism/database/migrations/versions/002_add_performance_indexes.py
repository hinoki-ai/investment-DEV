"""Add performance indexes

Revision ID: 002
Revises: 001
Create Date: 2024-01-02 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Investment indexes
    op.create_index('idx_investments_name', 'investments', ['name'])
    op.create_index('idx_investments_purchase_date', 'investments', ['purchase_date'])
    op.create_index('idx_investments_current_value', 'investments', ['current_value'])
    op.create_index('idx_investments_created_at', 'investments', ['created_at'])
    
    # File registry indexes
    op.create_index('idx_file_registry_file_hash', 'file_registry', ['file_hash'])
    op.create_index('idx_file_registry_mime_type', 'file_registry', ['mime_type'])
    op.create_index('idx_file_registry_status_created', 'file_registry', ['status', 'created_at'])
    
    # Processing jobs indexes
    op.create_index('idx_processing_jobs_created_at', 'processing_jobs', ['created_at'])
    op.create_index('idx_processing_jobs_worker', 'processing_jobs', ['worker_id'])
    op.create_index('idx_processing_jobs_scheduled', 'processing_jobs', ['scheduled_at'])
    
    # Analysis results indexes
    op.create_index('idx_analysis_results_confidence', 'analysis_results', ['confidence_score'])
    op.create_index('idx_analysis_results_created', 'analysis_results', ['created_at'])
    op.create_index('idx_analysis_results_model', 'analysis_results', ['model_version'])
    
    # Documents indexes
    op.create_index('idx_documents_date', 'documents', ['document_date'])
    op.create_index('idx_documents_created', 'documents', ['created_at'])
    
    # Valuation history indexes
    op.create_index('idx_valuation_date', 'valuation_history', ['valuation_date'])
    
    # Activity log indexes
    op.create_index('idx_activity_performed_by', 'activity_log', ['performed_by'])
    op.create_index('idx_activity_action', 'activity_log', ['action'])


def downgrade() -> None:
    # Drop indexes in reverse order
    op.drop_index('idx_activity_action', table_name='activity_log')
    op.drop_index('idx_activity_performed_by', table_name='activity_log')
    
    op.drop_index('idx_valuation_date', table_name='valuation_history')
    
    op.drop_index('idx_documents_created', table_name='documents')
    op.drop_index('idx_documents_date', table_name='documents')
    
    op.drop_index('idx_analysis_results_model', table_name='analysis_results')
    op.drop_index('idx_analysis_results_created', table_name='analysis_results')
    op.drop_index('idx_analysis_results_confidence', table_name='analysis_results')
    
    op.drop_index('idx_processing_jobs_scheduled', table_name='processing_jobs')
    op.drop_index('idx_processing_jobs_worker', table_name='processing_jobs')
    op.drop_index('idx_processing_jobs_created_at', table_name='processing_jobs')
    
    op.drop_index('idx_file_registry_status_created', table_name='file_registry')
    op.drop_index('idx_file_registry_mime_type', table_name='file_registry')
    op.drop_index('idx_file_registry_file_hash', table_name='file_registry')
    
    op.drop_index('idx_investments_created_at', table_name='investments')
    op.drop_index('idx_investments_current_value', table_name='investments')
    op.drop_index('idx_investments_purchase_date', table_name='investments')
    op.drop_index('idx_investments_name', table_name='investments')
