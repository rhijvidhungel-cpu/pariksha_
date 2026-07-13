from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database import get_raw_db
import bcrypt

router = APIRouter()


class Login(BaseModel):
    username: str
    password: str


class ChangePassword(BaseModel):
    user_id: int
    old_password: str
    new_password: str


class ResetPassword(BaseModel):
    username: str


class SetPin(BaseModel):
    user_id: int
    pin: str


class AdminResetWithPin(BaseModel):
    username: str
    pin: str


class ChangePin(BaseModel):
    user_id: int
    old_pin: str
    new_pin: str


class VerifyPin(BaseModel):
    username: str
    pin: str


class AdminResetWithPassword(BaseModel):
    username: str
    pin: str
    new_password: str


ADMIN_TEMP_PASSWORD = "temporary_password"


@router.post("/login")
def login(data: Login):
    try:
        with get_raw_db() as conn:
            cursor = conn.cursor()

            cursor.execute(
                """
                SELECT user_id, username,password, role, first_login
                FROM users
                WHERE username=%s;
                """,
                (data.username,),
            )

            user = cursor.fetchone()

            if not user:
                return {
                    "success": False,
                    "message": "Invalid login",
                }
            stored_password = (
                user["password"] if isinstance(user, dict) else user[2]
            )

# If password is already hashed
            if stored_password.startswith("$2"):
                valid = bcrypt.checkpw(
                    data.password.encode("utf-8"),
                    stored_password.encode("utf-8"),
                )
# Otherwise compare as plain text (old users)
            else:
                valid = (stored_password == data.password)

            if not valid:
                return {
                    "success": False,
                    "message": "Invalid login",
                }

            # Supports both RealDictCursor and normal cursor
            user_id = user["user_id"] if isinstance(user, dict) else user[0]
            username = user["username"] if isinstance(user, dict) else user[1]
            role = user["role"] if isinstance(user, dict) else user[3]
            first_login = user["first_login"] if isinstance(user, dict) else user[4]

            # Check if admin has a PIN set
            has_pin = False
            if role == "admin":
                cursor.execute(
                    "SELECT pin FROM users WHERE user_id=%s",
                    (user_id,),
                )
                pin_row = cursor.fetchone()
                pin_val = pin_row["pin"] if isinstance(pin_row, dict) else pin_row[0] if pin_row else None
                has_pin = bool(pin_val)

            # DEBUG
            print("========== LOGIN SUCCESS ==========")
            print("User ID      :", user_id)
            print("Username     :", username)
            print("Role         :", role)
            print("First Login  :", first_login)
            print("Has PIN      :", has_pin)
            print("===================================")

            return {
                "success": True,
                "user_id": user_id,
                "username": username,
                "email": username if role == "admin" else None,
                "role": role,
                "first_login": first_login,
                "has_pin": has_pin,
            }

    except Exception as e:
        return {
            "success": False,
            "message": f"Database error pipeline halt: {str(e)}",
        }


@router.post("/change-password")
def change_password(data: ChangePassword):
    try:
        with get_raw_db() as conn:
            cursor = conn.cursor()

            cursor.execute(
                """
                SELECT password
                FROM users
                WHERE user_id=%s;
                """,
                (data.user_id,),
            )

            user = cursor.fetchone()

            if not user:
                raise HTTPException(
                    status_code=404,
                    detail="User not found",
                )

            stored_password = (
                user["password"] if isinstance(user, dict) else user[0]
            )

            if stored_password.startswith("$2"):
                valid = bcrypt.checkpw(
                    data.old_password.encode(),
                    stored_password.encode(),
                )
            else:
                valid = (stored_password == data.old_password)

            if not valid:
                raise HTTPException(
                    status_code=400,
                    detail="Current password is incorrect.",
                )

            hashed_password = bcrypt.hashpw(
                data.new_password.encode(),
                bcrypt.gensalt()
            ).decode()

            cursor.execute(
                """
                UPDATE users
                SET password=%s,
                    first_login=FALSE
                WHERE user_id=%s;
                """,
                (
                    hashed_password,
                    data.user_id,
                ),
            )

            conn.commit()

            return {
                "success": True,
                "message": "Password changed successfully.",
            }

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e),
        )
        

@router.post("/reset-password")
def reset_password(data: ResetPassword):

    try:
        with get_raw_db() as conn:
            cursor = conn.cursor()

            cursor.execute(
                """
                SELECT temporary_password, role
                FROM users
                WHERE username=%s;
                """,
                (data.username,),
            )

            user = cursor.fetchone()

            if not user:
                raise HTTPException(
                    status_code=404,
                    detail="User not found",
                )

            role = user["role"] if isinstance(user, dict) else user[1]
            if role == "admin":
                raise HTTPException(
                    status_code=400,
                    detail="Admin accounts must use the admin password reset page.",
                )

            temporary_password = (
                user["temporary_password"]
                if isinstance(user, dict)
                else user[0]
            )

            if not temporary_password:
                raise HTTPException(
                    status_code=400,
                    detail="No temporary password on file for this account.",
                )

            # Hash the original temporary password
            hashed_password = bcrypt.hashpw(
                temporary_password.encode("utf-8"),
                bcrypt.gensalt()
            ).decode("utf-8")

            # Restore password and force first login
            cursor.execute(
                """
                UPDATE users
                SET password=%s,
                    first_login=TRUE
                WHERE username=%s;
                """,
                (
                    hashed_password,
                    data.username,
                ),
            )

            conn.commit()

            return {
                "success": True,
                "temporary_password": temporary_password,
                "message": "Password reset successfully."
            }

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e),
        )


@router.post("/admin/forgot-password")
def admin_forgot_password(data: ResetPassword):
    """Legacy endpoint - kept for backward compatibility.
    New flow uses PIN-based reset via /admin/reset-with-pin.
    """
    try:
        with get_raw_db() as conn:
            cursor = conn.cursor()

            cursor.execute(
                """
                SELECT user_id, role
                FROM users
                WHERE LOWER(username) = LOWER(%s);
                """,
                (data.username.strip(),),
            )
            user = cursor.fetchone()

            if not user:
                raise HTTPException(status_code=404, detail="Admin account not found.")

            role = user["role"] if isinstance(user, dict) else user[1]
            if role != "admin":
                raise HTTPException(
                    status_code=400,
                    detail="This reset option is only for admin accounts.",
                )

            hashed_password = bcrypt.hashpw(
                ADMIN_TEMP_PASSWORD.encode("utf-8"),
                bcrypt.gensalt(),
            ).decode("utf-8")

            cursor.execute(
                """
                UPDATE users
                SET password=%s,
                    temporary_password=%s,
                    first_login=TRUE
                WHERE LOWER(username) = LOWER(%s);
                """,
                (
                    hashed_password,
                    ADMIN_TEMP_PASSWORD,
                    data.username.strip(),
                ),
            )
            conn.commit()

            return {
                "success": True,
                "message": (
                    "Password reset successful. Log in with temporary_password, "
                    "then create your own password."
                ),
            }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/admin/check-pin-exists")
def admin_check_pin_exists(data: ResetPassword):
    """Check if an admin account has a PIN set. Returns has_pin status."""
    try:
        with get_raw_db() as conn:
            cursor = conn.cursor()

            cursor.execute(
                """
                SELECT user_id, pin, role
                FROM users
                WHERE LOWER(username) = LOWER(%s);
                """,
                (data.username.strip(),),
            )
            user = cursor.fetchone()

            if not user:
                raise HTTPException(status_code=404, detail="Admin account not found.")

            role = user["role"] if isinstance(user, dict) else user[2]
            if role != "admin":
                raise HTTPException(status_code=400, detail="Only admin accounts can use this endpoint.")

            stored_pin = user["pin"] if isinstance(user, dict) else user[1]
            has_pin = bool(stored_pin)

            return {
                "success": True,
                "has_pin": has_pin,
            }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/admin/verify-pin")
def admin_verify_pin(data: VerifyPin):
    """Step 1: Verify admin's PIN without resetting password."""
    try:
        with get_raw_db() as conn:
            cursor = conn.cursor()

            cursor.execute(
                """
                SELECT user_id, pin, role
                FROM users
                WHERE LOWER(username) = LOWER(%s);
                """,
                (data.username.strip(),),
            )
            user = cursor.fetchone()

            if not user:
                raise HTTPException(status_code=404, detail="Admin account not found.")

            role = user["role"] if isinstance(user, dict) else user[2]
            if role != "admin":
                raise HTTPException(status_code=400, detail="Only admin accounts can use this endpoint.")

            stored_pin = user["pin"] if isinstance(user, dict) else user[1]
            if not stored_pin:
                raise HTTPException(
                    status_code=400,
                    detail="No PIN is set for this admin. Contact ISMS at isms@ku.edu.np.",
                )

            # Verify the PIN
            if not bcrypt.checkpw(data.pin.encode("utf-8"), stored_pin.encode("utf-8")):
                raise HTTPException(status_code=400, detail="Incorrect PIN. Please try again.")

            return {
                "success": True,
                "message": "PIN verified successfully.",
                "user_id": user["user_id"] if isinstance(user, dict) else user[0],
            }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/admin/reset-password-with-username")
def admin_reset_password_with_username(data: AdminResetWithPassword):
    """Step 2: After PIN verification, reset admin password with new password."""
    try:
        if len(data.new_password) < 6:
            raise HTTPException(status_code=400, detail="New password must be at least 6 characters.")

        with get_raw_db() as conn:
            cursor = conn.cursor()

            cursor.execute(
                """
                SELECT user_id, pin, role
                FROM users
                WHERE LOWER(username) = LOWER(%s);
                """,
                (data.username.strip(),),
            )
            user = cursor.fetchone()

            if not user:
                raise HTTPException(status_code=404, detail="Admin account not found.")

            role = user["role"] if isinstance(user, dict) else user[2]
            if role != "admin":
                raise HTTPException(status_code=400, detail="Only admin accounts can reset with PIN.")

            stored_pin = user["pin"] if isinstance(user, dict) else user[1]
            if not stored_pin:
                raise HTTPException(
                    status_code=400,
                    detail="No PIN is set for this admin. Contact ISMS at isms@ku.edu.np.",
                )

            # Verify the PIN again
            if not bcrypt.checkpw(data.pin.encode("utf-8"), stored_pin.encode("utf-8")):
                raise HTTPException(status_code=400, detail="PIN verification failed. Please restart the process.")

            # Hash the new password
            hashed_password = bcrypt.hashpw(
                data.new_password.encode("utf-8"),
                bcrypt.gensalt(),
            ).decode("utf-8")

            cursor.execute(
                """
                UPDATE users
                SET password=%s,
                    temporary_password=%s,
                    first_login=FALSE
                WHERE LOWER(username) = LOWER(%s);
                """,
                (
                    hashed_password,
                    data.new_password,
                    data.username.strip(),
                ),
            )
            conn.commit()

            return {
                "success": True,
                "message": "Password reset successful. You can now log in with your new password.",
            }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/admin/set-pin")
def admin_set_pin(data: SetPin):
    """Set or create a secret PIN for the admin account."""
    try:
        if len(data.pin) < 4:
            raise HTTPException(status_code=400, detail="PIN must be at least 4 characters.")

        with get_raw_db() as conn:
            cursor = conn.cursor()

            # Verify user is admin
            cursor.execute(
                "SELECT role FROM users WHERE user_id=%s",
                (data.user_id,),
            )
            user = cursor.fetchone()
            if not user:
                raise HTTPException(status_code=404, detail="User not found.")

            role = user["role"] if isinstance(user, dict) else user[1]
            if role != "admin":
                raise HTTPException(status_code=403, detail="Only admins can set a PIN.")

            # Hash the PIN before storing
            hashed_pin = bcrypt.hashpw(
                data.pin.encode("utf-8"),
                bcrypt.gensalt(),
            ).decode("utf-8")

            cursor.execute(
                "UPDATE users SET pin=%s WHERE user_id=%s",
                (hashed_pin, data.user_id),
            )
            conn.commit()

            return {
                "success": True,
                "message": "Secret PIN set successfully.",
            }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/admin/change-pin")
def admin_change_pin(data: ChangePin):
    """Change the admin's secret PIN by verifying the old PIN first."""
    try:
        if len(data.new_pin) < 4:
            raise HTTPException(status_code=400, detail="New PIN must be at least 4 characters.")

        with get_raw_db() as conn:
            cursor = conn.cursor()

            cursor.execute(
                "SELECT pin, role FROM users WHERE user_id=%s",
                (data.user_id,),
            )
            user = cursor.fetchone()
            if not user:
                raise HTTPException(status_code=404, detail="User not found.")

            role = user["role"] if isinstance(user, dict) else user[1]
            if role != "admin":
                raise HTTPException(status_code=403, detail="Only admins can change PIN.")

            stored_pin = user["pin"] if isinstance(user, dict) else user[0]
            if not stored_pin:
                raise HTTPException(status_code=400, detail="No PIN set. Create one first.")

            # Verify old PIN
            if not bcrypt.checkpw(data.old_pin.encode("utf-8"), stored_pin.encode("utf-8")):
                raise HTTPException(status_code=400, detail="Current PIN is incorrect.")

            # Hash and save new PIN
            hashed_pin = bcrypt.hashpw(
                data.new_pin.encode("utf-8"),
                bcrypt.gensalt(),
            ).decode("utf-8")

            cursor.execute(
                "UPDATE users SET pin=%s WHERE user_id=%s",
                (hashed_pin, data.user_id),
            )
            conn.commit()

            return {
                "success": True,
                "message": "Secret PIN changed successfully.",
            }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/admin/reset-with-pin")
def admin_reset_with_pin(data: AdminResetWithPin):
    """Reset admin password using the secret PIN. Resets to temporary_password."""
    try:
        with get_raw_db() as conn:
            cursor = conn.cursor()

            cursor.execute(
                """
                SELECT user_id, pin, role, temporary_password
                FROM users
                WHERE LOWER(username) = LOWER(%s);
                """,
                (data.username.strip(),),
            )
            user = cursor.fetchone()

            if not user:
                raise HTTPException(status_code=404, detail="Admin account not found.")

            role = user["role"] if isinstance(user, dict) else user[2]
            if role != "admin":
                raise HTTPException(status_code=400, detail="Only admin accounts can reset with PIN.")

            stored_pin = user["pin"] if isinstance(user, dict) else user[1]
            if not stored_pin:
                raise HTTPException(
                    status_code=400,
                    detail="No PIN is set for this admin. Contact ISMS at isms@ku.edu.np.",
                )

            # Verify the PIN
            if not bcrypt.checkpw(data.pin.encode("utf-8"), stored_pin.encode("utf-8")):
                raise HTTPException(status_code=400, detail="Incorrect PIN. Please try again.")

            # Reset to temporary_password
            hashed_password = bcrypt.hashpw(
                ADMIN_TEMP_PASSWORD.encode("utf-8"),
                bcrypt.gensalt(),
            ).decode("utf-8")

            cursor.execute(
                """
                UPDATE users
                SET password=%s,
                    temporary_password=%s,
                    first_login=TRUE
                WHERE LOWER(username) = LOWER(%s);
                """,
                (
                    hashed_password,
                    ADMIN_TEMP_PASSWORD,
                    data.username.strip(),
                ),
            )
            conn.commit()

            return {
                "success": True,
                "message": (
                    "Password reset successful. Log in with 'temporary_password', "
                    "then create your own password and set a new PIN."
                ),
            }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))