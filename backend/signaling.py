from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, List

signaling_router = APIRouter()

active_meetings: Dict[str, List[WebSocket]] = {}

@signaling_router.websocket("/ws/{meeting_id}/{peer_id}")
async def websocket_endpoint(websocket: WebSocket, meeting_id: str, peer_id: str):
    print(f"🔗 WebSocket Connection Attempt: Meeting={meeting_id}, Peer={peer_id}")

    try:
        await websocket.accept()
        print(f"✅ WebSocket Connected: {peer_id}")
    except Exception as e:
        print(f"❌ WebSocket Rejected: {e}")
        return

    if meeting_id not in active_meetings:
        active_meetings[meeting_id] = []

    active_meetings[meeting_id].append(websocket)

    # Notify all users that a new participant has joined
    for connection in active_meetings[meeting_id]:
        if connection != websocket:
            await connection.send_json({"type": "user-joined", "peerId": peer_id})

    try:
        while True:
            data = await websocket.receive_text()
            print(f"📩 Received Data from {peer_id}: {data}")
            for connection in active_meetings[meeting_id]:
                if connection != websocket:
                    await connection.send_text(data)
    except WebSocketDisconnect:
        print(f"❌ User Disconnected: {peer_id}")
        active_meetings[meeting_id].remove(websocket)
