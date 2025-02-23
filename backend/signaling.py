import os
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, List
from database import chat_collection  # ✅ Import MongoDB collection
from models import ChatMessage
from datetime import datetime

signaling_router = APIRouter()
WEBSOCKET_HOST = os.getenv("WEBSOCKET_HOST", "0.0.0.0")
WEBSOCKET_PORT = int(os.getenv("WEBSOCKET_PORT", 8000))

# Active meetings and participants
active_meetings: Dict[str, Dict[str, WebSocket]] = {}
pending_users: Dict[str, List[str]] = {}  # Users waiting for approval
meeting_admins: Dict[str, str] = {}  # Admin for each meeting

@signaling_router.websocket("/ws/{meeting_id}/{peer_id}")
async def websocket_endpoint(websocket: WebSocket, meeting_id: str, peer_id: str):
    await websocket.accept()
    
    # Assign first user as admin
    if meeting_id not in meeting_admins:
        meeting_admins[meeting_id] = peer_id
        active_meetings[meeting_id] = {}  

    is_admin = meeting_admins[meeting_id] == peer_id

    if not is_admin:
        if meeting_id not in pending_users:
            pending_users[meeting_id] = []
        pending_users[meeting_id].append(peer_id)

        admin_id = meeting_admins[meeting_id]
        admin_ws = active_meetings[meeting_id].get(admin_id)

        if admin_ws:
            await admin_ws.send_json({"type": "approval-request", "peerId": peer_id})

        while peer_id in pending_users[meeting_id]:
            message = await websocket.receive_text()
            if message == "approved":
                pending_users[meeting_id].remove(peer_id)

    active_meetings[meeting_id][peer_id] = websocket

    for connection in active_meetings[meeting_id].values():
        if connection != websocket:
            await connection.send_json({"type": "user-joined", "peerId": peer_id})

    try:
        while True:
            data = await websocket.receive_json()

            # Handle Chat Messages
            if data["type"] == "chat-message":
                sender = data["sender"]
                message = data["message"]

                chat_msg = ChatMessage(
                    meeting_id=meeting_id,
                    sender=sender,
                    message=message,
                    timestamp=datetime.utcnow()
                )

                try:
                    # ✅ Store in MongoDB
                    result = await chat_collection.insert_one(chat_msg.dict())
                    print(f"✅ Chat message saved with ID: {result.inserted_id}")
                except Exception as e:
                    print(f"❌ Error saving chat message: {e}")

                # ✅ Broadcast message to all meeting participants
                for connection in active_meetings.get(meeting_id, {}).values():
                    try:
                        await connection.send_json({
                            "type": "chat-message",
                            "sender": sender,
                            "message": message
                        })
                        print(f"📩 Message sent to {connection}")
                    except Exception as e:
                        print(f"❌ Error sending message: {e}")


    except WebSocketDisconnect:
        del active_meetings[meeting_id][peer_id]
        for connection in active_meetings[meeting_id].values():
            await connection.send_json({"type": "user-left", "peerId": peer_id})
