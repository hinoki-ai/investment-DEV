"""
===============================================================================
WORKER MAIN - Intelligence Layer Orchestrator
===============================================================================
Polls for jobs, processes files with Kimi K2.5, saves results.
===============================================================================
"""
import json
import os
import signal
import sys
import time
import traceback
from datetime import datetime
from typing import Optional
from uuid import UUID

import psycopg2
from psycopg2.extras import RealDictCursor

from storage import get_storage
from ai_client import get_ai_client, AnalysisResult


# =============================================================================
# CONFIGURATION
# =============================================================================

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://investor:family_future_2024@localhost:5432/investments")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
POLL_INTERVAL = int(os.getenv("WORKER_POLL_INTERVAL", "10"))  # seconds
MAX_CONCURRENT = int(os.getenv("MAX_CONCURRENT_JOBS", "3"))
WORKER_ID = os.getenv("HOSTNAME", f"worker-{os.getpid()}")

# =============================================================================
# DATABASE CONNECTION
# =============================================================================

def get_db_connection():
    """Get database connection."""
    return psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)


# =============================================================================
# JOB PROCESSING
# =============================================================================

class Worker:
    """Main worker class for processing analysis jobs."""
    
    def __init__(self):
        self.storage = get_storage()
        self.ai = get_ai_client()
        self.running = True
        self.current_job: Optional[dict] = None
        
        # Setup signal handlers
        signal.signal(signal.SIGTERM, self._signal_handler)
        signal.signal(signal.SIGINT, self._signal_handler)
    
    def _signal_handler(self, signum, frame):
        """Handle shutdown signals gracefully."""
        print(f"\n⚠️ Received signal {signum}, shutting down...")
        self.running = False
        
        # If processing a job, mark it as failed
        if self.current_job:
            self._fail_job(self.current_job["id"], "Worker shutdown during processing")
    
    def _claim_job(self) -> Optional[dict]:
        """Claim the next available job from the queue."""
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                # Use SELECT FOR UPDATE SKIP LOCKED for concurrent workers
                cur.execute("""
                    SELECT 
                        pj.id, pj.job_type, pj.file_id, pj.investment_id,
                        pj.priority, pj.parameters, pj.retry_count, pj.max_retries,
                        fr.storage_key, fr.storage_bucket, fr.original_filename,
                        fr.mime_type, i.name as investment_name, i.category as investment_category
                    FROM processing_jobs pj
                    JOIN file_registry fr ON pj.file_id = fr.id
                    LEFT JOIN investments i ON pj.investment_id = i.id
                    WHERE pj.status = 'queued'
                    ORDER BY pj.priority ASC, pj.created_at ASC
                    FOR UPDATE SKIP LOCKED
                    LIMIT 1
                """)
                
                job = cur.fetchone()
                
                if job:
                    # Mark as running
                    cur.execute("""
                        UPDATE processing_jobs
                        SET status = 'running',
                            worker_id = %s,
                            started_at = NOW(),
                            retry_count = retry_count + 1
                        WHERE id = %s
                    """, (WORKER_ID, job["id"]))
                    
                    conn.commit()
                    return dict(job)
                
                return None
        finally:
            conn.close()
    
    def _complete_job(self, job_id: str, result_id: str):
        """Mark a job as completed."""
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    UPDATE processing_jobs
                    SET status = 'completed',
                        completed_at = NOW(),
                        result_id = %s
                    WHERE id = %s
                """, (result_id, job_id))
                
                # Also update file registry status
                cur.execute("""
                    UPDATE file_registry
                    SET status = 'completed',
                        processed_at = NOW()
                    WHERE id = (SELECT file_id FROM processing_jobs WHERE id = %s)
                """, (job_id,))
                
                conn.commit()
        finally:
            conn.close()
    
    def _fail_job(self, job_id: str, error_message: str):
        """Mark a job as failed or retry."""
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                # Check retry count
                cur.execute("""
                    SELECT retry_count, max_retries
                    FROM processing_jobs
                    WHERE id = %s
                """, (job_id,))
                
                row = cur.fetchone()
                if row and row["retry_count"] < row["max_retries"]:
                    # Re-queue for retry
                    cur.execute("""
                        UPDATE processing_jobs
                        SET status = 'queued',
                            worker_id = NULL,
                            started_at = NULL,
                            error_message = %s
                        WHERE id = %s
                    """, (error_message, job_id))
                else:
                    # Mark as failed
                    cur.execute("""
                        UPDATE processing_jobs
                        SET status = 'failed',
                            completed_at = NOW(),
                            error_message = %s
                        WHERE id = %s
                    """, (error_message, job_id))
                    
                    # Update file registry
                    cur.execute("""
                        UPDATE file_registry
                        SET status = 'failed'
                        WHERE id = (SELECT file_id FROM processing_jobs WHERE id = %s)
                    """, (job_id,))
                
                conn.commit()
        finally:
            conn.close()
    
    def _save_analysis_result(self, job: dict, analysis_data: dict) -> str:
        """Save analysis results to database."""
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO analysis_results (
                        job_id, file_id, investment_id, analysis_type, model_version,
                        provider, raw_text, structured_data, summary, extracted_entities,
                        extracted_dates, extracted_amounts, confidence_score,
                        quality_flags, processing_time_ms, tokens_used
                    ) VALUES (
                        %s, %s, %s, %s, %s, %s,
                        %s, %s, %s, %s,
                        %s, %s, %s,
                        %s, %s, %s
                    )
                    RETURNING id
                """, (
                    job["id"],
                    job["file_id"],
                    job["investment_id"],
                    job["job_type"],
                    analysis_data.get("model"),
                    analysis_data.get("provider", "unknown"),
                    analysis_data.get("raw_text"),
                    json.dumps(analysis_data.get("structured_data", {})),
                    analysis_data.get("structured_data", {}).get("summary"),
                    json.dumps(analysis_data.get("structured_data", {}).get("entities", {})),
                    json.dumps(analysis_data.get("structured_data", {}).get("dates_found", [])),
                    json.dumps(analysis_data.get("structured_data", {}).get("amounts_found", [])),
                    analysis_data.get("confidence_score", 0.8),
                    analysis_data.get("quality_flags", []),
                    analysis_data.get("processing_time_ms"),
                    analysis_data.get("tokens_used")
                ))
                
                result_id = cur.fetchone()["id"]
                conn.commit()
                return str(result_id)
        finally:
            conn.close()
    
    def _determine_analysis_type(self, job: dict) -> str:
        """Determine the best analysis type based on job and file."""
        job_type = job.get("job_type", "document_analysis")
        investment_category = job.get("investment_category")
        mime_type = job.get("mime_type", "")
        filename = job.get("original_filename", "").lower()
        
        # Map job types
        if job_type == "land_analysis" or investment_category == "land":
            return "land_analysis"
        elif job_type == "ocr":
            return "ocr"
        elif job_type == "contract_extraction" or "contract" in filename:
            return "contract_extraction"
        elif job_type == "receipt_extraction" or "receipt" in filename or "recibo" in filename:
            return "receipt_extraction"
        
        # Default based on file type
        if mime_type.startswith("image/"):
            if any(x in filename for x in ["deed", "escritura", "matricula"]):
                return "document_analysis"
            return "ocr"
        
        return "document_analysis"
    
    def process_job(self, job: dict) -> bool:
        """
        Process a single job.
        Returns True if successful, False otherwise.
        """
        job_id = job["id"]
        file_id = job["file_id"]
        storage_key = job["storage_key"]
        
        print(f"\n🔍 Processing job {job_id[:8]}...")
        print(f"   File: {job.get('original_filename')}")
        print(f"   Investment: {job.get('investment_name', 'N/A')}")
        
        local_path = None
        start_time = time.time()
        
        try:
            # 1. Download file from storage
            print("   📥 Downloading file...")
            local_path = self.storage.download_file(storage_key, str(file_id))
            print(f"   ✅ Downloaded to {local_path}")
            
            # 2. Determine analysis type
            analysis_type = self._determine_analysis_type(job)
            print(f"   🧠 Analysis type: {analysis_type}")
            
            # 3. Run AI analysis
            print(f"   🔄 Running AI analysis ({self.ai.provider_name})...")
            result_obj = self.ai.analyze_document(
                file_path=local_path,
                analysis_type=analysis_type
            )
            analysis_result = result_obj.to_dict()
            
            processing_time = int((time.time() - start_time) * 1000)
            analysis_result["processing_time_ms"] = processing_time
            
            print(f"   ✅ Analysis complete ({processing_time}ms)")
            
            # 4. Save results
            print("   💾 Saving results...")
            result_id = self._save_analysis_result(job, analysis_result)
            print(f"   ✅ Result saved: {result_id[:8]}")
            
            # 5. Complete job
            self._complete_job(job_id, result_id)
            print(f"   ✨ Job completed successfully!")
            
            return True
            
        except Exception as e:
            error_msg = f"{type(e).__name__}: {str(e)}"
            print(f"   ❌ Job failed: {error_msg}")
            traceback.print_exc()
            self._fail_job(job_id, error_msg)
            return False
            
        finally:
            # Cleanup downloaded file
            if local_path:
                self.storage.cleanup_file(local_path)
    
    def run(self):
        """Main worker loop."""
        print(f"""
╔══════════════════════════════════════════════════════════════╗
║     🤖 NEXUS AI WORKER - Multi-Provider Intelligence        ║
╠══════════════════════════════════════════════════════════════╣
║  Worker ID: {WORKER_ID:<45} ║
║  Poll Interval: {POLL_INTERVAL}s{'':42} ║
║  Max Concurrent: {MAX_CONCURRENT}{'':42} ║
╚══════════════════════════════════════════════════════════════╝
        """)
        
        consecutive_errors = 0
        
        while self.running:
            try:
                # Claim a job
                job = self._claim_job()
                
                if job:
                    consecutive_errors = 0
                    self.current_job = job
                    self.process_job(job)
                    self.current_job = None
                else:
                    # No jobs available, wait before polling again
                    time.sleep(POLL_INTERVAL)
                    
            except Exception as e:
                consecutive_errors += 1
                print(f"❌ Worker error: {e}")
                traceback.print_exc()
                
                # Back off on repeated errors
                if consecutive_errors > 5:
                    sleep_time = min(60, POLL_INTERVAL * consecutive_errors)
                    print(f"⏱️  Backing off for {sleep_time}s due to repeated errors...")
                    time.sleep(sleep_time)
                else:
                    time.sleep(POLL_INTERVAL)
        
        print("👋 Worker shutdown complete.")


# =============================================================================
# MAIN ENTRY
# =============================================================================

if __name__ == "__main__":
    worker = Worker()
    worker.run()
