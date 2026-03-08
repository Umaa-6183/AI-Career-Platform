"""
Unit Tests — Authentication Module
Tests JWT creation, decoding, password hashing, and email anonymization.
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import pytest
from auth import (
    hash_password, verify_password, hash_email, anonymize_name,
    create_access_token, decode_access_token, create_refresh_token
)


# ── Password Hashing ──────────────────────────────────────────────────────────

class TestPasswordHashing:

    def test_hash_is_not_plaintext(self):
        hashed = hash_password("mypassword123")
        assert hashed != "mypassword123"

    def test_verify_correct_password(self):
        hashed = hash_password("correct_password")
        assert verify_password("correct_password", hashed) is True

    def test_reject_wrong_password(self):
        hashed = hash_password("correct_password")
        assert verify_password("wrong_password", hashed) is False

    def test_same_password_different_hashes(self):
        h1 = hash_password("password123")
        h2 = hash_password("password123")
        assert h1 != h2  # bcrypt adds salt

    def test_hash_length(self):
        hashed = hash_password("test")
        assert len(hashed) > 50  # bcrypt hashes are long


# ── Email Hashing ─────────────────────────────────────────────────────────────

class TestEmailHashing:

    def test_same_email_same_hash(self):
        assert hash_email("test@example.com") == hash_email("test@example.com")

    def test_different_emails_different_hashes(self):
        assert hash_email("a@example.com") != hash_email("b@example.com")

    def test_case_insensitive(self):
        assert hash_email("Test@Example.COM") == hash_email("test@example.com")

    def test_hash_is_hex_string(self):
        h = hash_email("test@example.com")
        assert len(h) == 64  # SHA-256 = 64 hex chars
        int(h, 16)  # should not raise

    def test_pii_not_recoverable(self):
        h = hash_email("private@secret.com")
        assert "private" not in h
        assert "secret" not in h


# ── Name Anonymization ────────────────────────────────────────────────────────

class TestNameAnonymization:

    def test_full_name_shortened(self):
        assert anonymize_name("John Smith") == "John S."

    def test_single_name(self):
        assert anonymize_name("Madonna") == "Madonna"

    def test_three_part_name(self):
        result = anonymize_name("John Michael Smith")
        assert result == "John S."  # uses first + last initial

    def test_whitespace_stripped(self):
        result = anonymize_name("  Alice Johnson  ")
        assert result == "Alice J."

    def test_empty_string(self):
        result = anonymize_name("")
        assert result == "User"


# ── JWT Tokens ────────────────────────────────────────────────────────────────

class TestJWTTokens:

    def test_create_and_decode_access_token(self):
        token = create_access_token("user-123")
        payload = decode_access_token(token)
        assert payload["sub"] == "user-123"

    def test_token_type_is_access(self):
        token = create_access_token("user-123")
        payload = decode_access_token(token)
        assert payload["type"] == "access"

    def test_extra_claims_included(self):
        token = create_access_token("user-123", extra={"role": "admin"})
        payload = decode_access_token(token)
        assert payload["role"] == "admin"

    def test_invalid_token_raises(self):
        from fastapi import HTTPException
        with pytest.raises(HTTPException):
            decode_access_token("this.is.not.a.valid.jwt")

    def test_tampered_token_rejected(self):
        from fastapi import HTTPException
        token = create_access_token("user-123")
        tampered = token[:-5] + "XXXXX"
        with pytest.raises(HTTPException):
            decode_access_token(tampered)

    def test_refresh_token_is_unique(self):
        r1 = create_refresh_token()
        r2 = create_refresh_token()
        assert r1 != r2

    def test_refresh_token_length(self):
        r = create_refresh_token()
        assert len(r) > 40  # URL-safe 64 bytes = 86 chars
