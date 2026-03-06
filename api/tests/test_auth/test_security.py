from __future__ import annotations

import uuid

from jose import JWTError, jwt

from src.auth.security import (
    ALGORITHM,
    create_access_token,
    create_refresh_token,
    decode_access_token,
    hash_password,
    hash_token,
    verify_password,
)

SECRET = "test-secret-key"


class TestPasswordHashing:
    def test_hash_password_returns_bcrypt_hash(self) -> None:
        hashed = hash_password("mypassword")
        assert hashed.startswith("$2b$")

    def test_verify_password_correct(self) -> None:
        hashed = hash_password("mypassword")
        assert verify_password("mypassword", hashed) is True

    def test_verify_password_incorrect(self) -> None:
        hashed = hash_password("mypassword")
        assert verify_password("wrongpassword", hashed) is False

    def test_hash_password_unique_per_call(self) -> None:
        h1 = hash_password("same")
        h2 = hash_password("same")
        assert h1 != h2  # Different salts


class TestAccessToken:
    def test_create_and_decode(self) -> None:
        user_id = uuid.uuid4()
        token = create_access_token(user_id, SECRET, expires_minutes=15)
        payload = decode_access_token(token, SECRET)
        assert payload["sub"] == str(user_id)
        assert payload["type"] == "access"

    def test_decode_with_wrong_secret_fails(self) -> None:
        user_id = uuid.uuid4()
        token = create_access_token(user_id, SECRET)
        try:
            decode_access_token(token, "wrong-secret")
            assert False, "Should have raised JWTError"
        except JWTError:
            pass

    def test_decode_expired_token_fails(self) -> None:
        user_id = uuid.uuid4()
        token = create_access_token(user_id, SECRET, expires_minutes=-1)
        try:
            decode_access_token(token, SECRET)
            assert False, "Should have raised JWTError"
        except JWTError:
            pass

    def test_decode_wrong_type_fails(self) -> None:
        payload = {"sub": str(uuid.uuid4()), "type": "refresh"}
        token = jwt.encode(payload, SECRET, algorithm=ALGORITHM)
        try:
            decode_access_token(token, SECRET)
            assert False, "Should have raised JWTError"
        except JWTError:
            pass

    def test_decode_missing_sub_fails(self) -> None:
        payload = {"type": "access"}
        token = jwt.encode(payload, SECRET, algorithm=ALGORITHM)
        try:
            decode_access_token(token, SECRET)
            assert False, "Should have raised JWTError"
        except JWTError:
            pass


class TestRefreshToken:
    def test_create_refresh_token_is_url_safe(self) -> None:
        token = create_refresh_token()
        assert len(token) > 40
        # url-safe base64 characters only
        assert all(c.isalnum() or c in "-_" for c in token)

    def test_create_refresh_token_unique(self) -> None:
        t1 = create_refresh_token()
        t2 = create_refresh_token()
        assert t1 != t2


class TestHashToken:
    def test_hash_token_deterministic(self) -> None:
        assert hash_token("abc") == hash_token("abc")

    def test_hash_token_different_inputs(self) -> None:
        assert hash_token("abc") != hash_token("def")

    def test_hash_token_is_hex(self) -> None:
        h = hash_token("test")
        assert len(h) == 64  # SHA-256 hex
        int(h, 16)  # Should not raise
