# Database Schema v1 (PostgreSQL)

## Tables
- users(id, email unique, password_hash, name, created_at, updated_at)
- sessions(id, user_id fk, refresh_token_hash, expires_at, created_at)
- organizations(id, name, slug unique, created_at)
- memberships(id, organization_id fk, user_id fk, role, created_at, unique(organization_id,user_id))
- invitations(id, organization_id fk, email, role, status, expires_at, inviter_user_id fk, created_at)
- reports(id, organization_id fk, reporter_user_id fk, title, description, priority, status, visibility, page_url, metadata_jsonb, created_at, updated_at)
- upload_sessions(id, report_id fk, upload_key, content_type, expires_at, created_at)
- artifacts(id, report_id fk, kind, object_key, content_type, size_bytes, created_at)

## Indexes
- reports(organization_id, created_at desc)
- invitations(organization_id, status)
- memberships(user_id)
- artifacts(report_id)
