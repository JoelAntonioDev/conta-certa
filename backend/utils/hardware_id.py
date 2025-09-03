# utils/hardware_id.py
import hashlib
import platform
import uuid

def get_machine_id() -> str:
    # Junta várias características do sistema
    info = (
        platform.node() +
        platform.system() +
        platform.machine() +
        platform.processor() +
        str(uuid.getnode())
    )
    return hashlib.sha256(info.encode()).hexdigest()
