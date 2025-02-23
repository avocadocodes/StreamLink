import { useRouter } from "next/router";
import { AuthContext } from "../../context/AuthContext";
import { useEffect, useContext, useRef, useState } from "react";
import Peer from "peerjs";
import axios, {AxiosError } from "axios";
import { api } from "../../context/AuthContext"; 
const MeetingPage = () => {
  const auth = useContext(AuthContext);
  const user = auth?.user; 
  if (!user) {
    return <div className="flex items-center justify-center h-screen text-xl">Loading...</div>;
  }
  const router = useRouter();
  const { id: meetingId } = router.query;
  const [peer, setPeer] = useState<Peer | null>(null);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [meetingLink, setMeetingLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const myVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideosRef = useRef<{ [key: string]: HTMLVideoElement }>({});
  const [isAdmin, setIsAdmin] = useState(false);
  const [pendingUsers, setPendingUsers] = useState<string[]>([]);
  const [messages, setMessages] = useState<{ sender: string; message: string }[]>([]);
  const [newMessage, setNewMessage] = useState("");

  useEffect(() => {
    if (!meetingId || !user) return;  // ✅ Ensure user is available before using it
  
    const websocketURL = process.env.NEXT_PUBLIC_WEBSOCKET_URL || "ws://localhost:8000";
    const frontendURL = process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000";
  
    setMeetingLink(`${frontendURL}/meeting/${meetingId}`);
  
    const userPeerId = Math.random().toString(36).substring(7);
    const newSocket = new WebSocket(`${websocketURL}/ws/${meetingId}/${userPeerId}`);
  
    newSocket.onopen = async () => {
      console.log("✅ WebSocket Connected!");
  
      try {
        const res = await api.post("/start-meeting", {  // ✅ Use `api.post()` instead of `axios.post()`
          meeting_id: meetingId,
          username: user.username,
        });
  
        if (res.data.is_admin) {
          setIsAdmin(true);
        }
  
        newSocket.send(JSON.stringify({ type: "new-user", peerId: userPeerId }));
      } catch (error) {
        console.error("❌ Failed to start meeting:", error);
      }
    };
  
    newSocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
  
      switch (data.type) {
        case "chat-message":
          console.log("📩 New Chat Message:", data);
          setMessages((prev) => [...prev, { sender: data.sender, message: data.message }]);
          break;
        case "new-user":
          if (data.peerId !== userPeerId) {
            callUser(data.peerId);
          }
          break;
        default:
          console.warn("⚠️ Unknown WebSocket Event:", data);
      }
    };
  
    setSocket(newSocket);
  
    return () => {
      newSocket.close();
    };
  }, [meetingId, user]);
  

  useEffect(() => {
    if (!user || !meetingId) return;
  
    api.post("/join-meeting", { meeting_id: meetingId, username: user.username })
      .catch((error:AxiosError) => console.error("❌ Failed to join meeting:", error));
  }, [user, meetingId]);
  
  useEffect(() => {
    if (!socket || !peer) return;
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "approval-request" && isAdmin) {
        setPendingUsers((prev) => [...prev, data.peerId]);
      }
    };
  }, [socket, peer]);

  const approveUser = (peerId: string) => {
    setPendingUsers((prev) => prev.filter((id) => id !== peerId));
    socket?.send(JSON.stringify({ type: "approved", peerId }));
  };



  useEffect(() => {
    if (localStream || myVideoRef.current?.srcObject) return;

    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        setLocalStream(stream);
        if (myVideoRef.current) {
          myVideoRef.current.srcObject = stream;
        }
      })
      .catch((error) => console.error("❌ Camera/Microphone Error:", error));
  }, []);

  useEffect(() => {
    const newPeer = new Peer();
    setPeer(newPeer);

    newPeer.on("open", (id) => {
      console.log(`🎯 Peer ID: ${id}`);
    });

    return () => {
      newPeer.destroy();
    };
  }, []);

  useEffect(() => {
    if (!peer || !localStream) return;

    peer.on("call", (call) => {
      call.answer(localStream);
      call.on("stream", (remoteStream) => {
        addRemoteVideo(call.peer, remoteStream);
      });
    });

    return () => {
      peer.off("call");
    };
  }, [peer, localStream]);
  const sendMessage = () => {
    if (!newMessage || !socket) {
      console.error("⚠️ Cannot send message: WebSocket is not connected.");
      return;
    }  
    const chatMessage = { type: "chat-message", sender: user.username, message: newMessage };
    setMessages((prev) => [...prev, chatMessage]);
    console.log("📤 Sending Chat Message:", chatMessage);
    socket.send(JSON.stringify(chatMessage));
    setNewMessage("");
  };
  
  const addRemoteVideo = (peerId: string, stream: MediaStream) => {
    if (!remoteVideosRef.current[peerId]) {
      const videoElement = document.createElement("video");
      videoElement.srcObject = stream;
      videoElement.autoplay = true;
      videoElement.playsInline = true;
      document.getElementById("remote-videos")?.appendChild(videoElement);
      remoteVideosRef.current[peerId] = videoElement;
    }
  };

  const callUser = (remotePeerId: string) => {
    if (!peer || !localStream) return;

    const call = peer.call(remotePeerId, localStream);
    call.on("stream", (remoteStream) => {
      addRemoteVideo(remotePeerId, remoteStream);
    });
  };

  const copyLink = () => {
    if (meetingLink) {
      navigator.clipboard.writeText(meetingLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const toggleMute = () => {
    localStream?.getAudioTracks().forEach((track) => {
      track.enabled = !track.enabled;
    });
    setIsMuted(!isMuted);
  };

  const toggleVideo = () => {
    localStream?.getVideoTracks().forEach((track) => {
      track.enabled = !track.enabled;
    });
    setIsVideoOff(!isVideoOff);
  };

  const leaveMeeting = () => {
    socket?.close();
    peer?.destroy();
    router.push("/");
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h2 className="text-xl font-bold">Meeting ID: {meetingId}</h2>

      {meetingLink && (
        <div className="flex flex-col items-center space-y-2 mt-4 bg-white text-black p-4 rounded-lg shadow-lg">
          <p className="text-lg font-semibold">Share this link:</p>
          <div className="flex items-center space-x-2 border p-2 rounded-md w-full">
            <span className="truncate w-64">{meetingLink}</span>
            <button className="bg-green-500 text-white px-3 py-1 rounded-md" onClick={copyLink}>
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>
      )}

      <div className="flex w-full max-w-6xl mt-4r">
        <div className="flex flex-col w-2/3 items-center">
          <video ref={myVideoRef} autoPlay muted className="w-full h-[400px] border-2 border-white rounded-lg shadow-lg" />
          <div id="remote-videos" className="flex flex-wrap gap-2 mt-4"></div>
        </div>
        {/* Chat Section */}
        <div className="w-1/3 bg-gray-100 text-black p-4 shadow-lg rounded-lg">
          <h2 className="text-lg font-bold mb-2">Live Chat</h2>
          <div className="overflow-y-auto h-80 p-2 border text-black bg-white">
            {messages.map((msg, index) => (
              <div key={index} className={`p-1 my-1 ${msg.sender === user.username ? "text-right" : "text-left"}`}>
                <span className="font-bold">{msg.sender}: </span>
                {msg.message}
              </div>
            ))}
          </div>
          <div className="flex mt-2">
            <input
              type="text"
              className="border p-2 flex-1 rounded-lg"
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
            />
            <button className="bg-blue-500 text-white px-4 py-2 ml-2 rounded-lg" onClick={sendMessage}>
              Send
            </button>
          </div>
        </div>

      </div>
      <div className="flex space-x-4 mt-6">
        <button onClick={toggleMute} className="px-4 py-2 bg-gray-500 text-white rounded-md">
          {isMuted ? "Unmute Mic" : "Mute Mic"}
        </button>
        <button onClick={toggleVideo} className="px-4 py-2 bg-gray-500 text-white rounded-md">
          {isVideoOff ? "Turn On Camera" : "Turn Off Camera"}
        </button>
        <button onClick={leaveMeeting} className="px-4 py-2 bg-red-500 text-white rounded-md">
          Leave Call
        </button>
      </div>
    </div>
  );
};

export default MeetingPage;
