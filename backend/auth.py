"""
CareerIQ Pro - Authentication Module
JWT-based auth with access + refresh token rotation
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from passlib.context import CryptContext
from datetime import datetime, timedelta
from typing import Optional
import hashlib
import secrets
import uuid

from database import get_db, User, UserSession
from sqlalchemy.orm import Session

# ── Config ─────────────────────────────────────────────────────────────────────
SECRET_KEY    = "careeriq-secret-change-in-production"
ALGORITHM     = "HS256"
ACCESS_EXPIRE = timedelta(minutes=60 * 24 * 7)    # 7 days
REFRESH_EXPIRE = timedelta(days=30)

pwd_context  = CryptContext(schemes=["bcrypt"], deprecated="auto")
bearer_scheme = HTTPBearer(auto_error=False)


# ── Password Utilities ─────────────────────────────────────────────────────────

def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def hash_email(email: str) -> str:
    """One-way SHA-256 hash of email for privacy-safe lookups"""
    return hashlib.sha256(email.lower().encode()).hexdigest()


def anonymize_name(full_name: str) -> str:
    """Convert 'John Smith' → 'John S.' for privacy-safe display"""
    parts = full_name.strip().split()
    if len(parts) >= 2:
        return f"{parts[0]} {parts[-1][0]}."
    return parts[0] if parts else "User"


# ── JWT Tokens ─────────────────────────────────────────────────────────────────

def create_access_token(user_id: str, extra: dict = None) -> str:
    payload = {
        "sub": user_id,
        "type": "access",
        "iat": datetime.utcnow(),
        "exp": datetime.utcnow() + ACCESS_EXPIRE,
        **(extra or {}),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def create_refresh_token() -> str:
    return secrets.token_urlsafe(64)


def decode_access_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "access":
            raise JWTError("Wrong token type")
        return payload
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )


# ── FastAPI Dependencies ───────────────────────────────────────────────────────

async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    if not credentials:
        raise HTTPException(status_code=401, detail="No credentials provided")

    payload = decode_access_token(credentials.credentials)
    user_id = payload.get("sub")

    user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found or inactive")
    return user


async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> Optional[User]:
    """Returns user if token present, None otherwise (for public+auth routes)"""
    try:
        if not credentials:
            return None
        return await get_current_user(credentials, db)
    except HTTPException:
        return None


# ── Auth Service ───────────────────────────────────────────────────────────────

class AuthService:

    @staticmethod
    def register(db: Session, email: str, password: str, name: str, role: str) -> dict:
        email_hash = hash_email(email)
        if db.query(User).filter(User.email_hash == email_hash).first():
            raise HTTPException(status_code=400, detail="Email already registered")

        user = User(
            id=str(uuid.uuid4()),
            email_hash=email_hash,
            name_alias=anonymize_name(name),
            current_role=role,
            hashed_password=hash_password(password),
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        access_token = create_access_token(user.id)
        refresh_token = create_refresh_token()
        session = UserSession(
            user_id=user.id,
            refresh_token=hash_password(refresh_token),
            expires_at=datetime.utcnow() + REFRESH_EXPIRE,
        )
        db.add(session)
        db.commit()

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "user_id": user.id,
        }

    @staticmethod
    def login(db: Session, email: str, password: str) -> dict:
        email_hash = hash_email(email)
        user = db.query(User).filter(User.email_hash == email_hash, User.is_active == True).first()

        if not user or not verify_password(password, user.hashed_password):
            raise HTTPException(status_code=401, detail="Invalid credentials")

        user.last_login = datetime.utcnow()
        db.commit()

        access_token = create_access_token(user.id)
        refresh_token = create_refresh_token()
        session = UserSession(
            user_id=user.id,
            refresh_token=hash_password(refresh_token),
            expires_at=datetime.utcnow() + REFRESH_EXPIRE,
        )
        db.add(session)
        db.commit()

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "user_id": user.id,
            "name_alias": user.name_alias,
        }

    @staticmethod
    def refresh(db: Session, refresh_token: str) -> dict:
        sessions = db.query(UserSession).filter(
            UserSession.revoked == False,
            UserSession.expires_at > datetime.utcnow(),
        ).all()

        matched_session = None
        for session in sessions:
            if verify_password(refresh_token, session.refresh_token):
                matched_session = session
                break

        if not matched_session:
            raise HTTPException(status_code=401, detail="Invalid or expired refresh token")

        matched_session.revoked = True
        db.commit()

        new_access = create_access_token(matched_session.user_id)
        new_refresh = create_refresh_token()
        new_session = UserSession(
            user_id=matched_session.user_id,
            refresh_token=hash_password(new_refresh),
            expires_at=datetime.utcnow() + REFRESH_EXPIRE,
        )
        db.add(new_session)
        db.commit()

        return {"access_token": new_access, "refresh_token": new_refresh, "token_type": "bearer"}

    @staticmethod
    def logout(db: Session, refresh_token: str) -> bool:
        sessions = db.query(UserSession).filter(UserSession.revoked == False).all()
        for session in sessions:
            if verify_password(refresh_token, session.refresh_token):
                session.revoked = True
                db.commit()
                return True
        return False

    @staticmethod
    def delete_account(db: Session, user: User) -> bool:
        """Hard delete — GDPR right to erasure"""
        db.delete(user)
        db.commit()
        return True
