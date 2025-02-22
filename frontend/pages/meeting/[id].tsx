import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import Peer from "peerjs";

const MeetingPage = () => {
  const router = useRouter();
  const { id: meetingId } = router.query;
  const [peer, setPeer] = useState<Peer | null>(null);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [meetingLink, setMeetingLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const myVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideosRef = useRef<{ [key: string]: HTMLVideoElement }>({});
  let localStream: MediaStream;

  useEffect(() => {
    if (!meetingId) return;

    if (typeof window !== "undefined") {
      setMeetingLink(`${window.location.origin}/meeting/${meetingId}`);
    }

    const userPeerId = Math.random().toString(36).substring(7);
    const newSocket = new WebSocket(`ws://localhost:8000/ws/${meetingId}/${userPeerId}`);
    setSocket(newSocket);

    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        localStream = stream;
        if (myVideoRef.current) {
          myVideoRef.current.srcObject = stream;
        }
      })
      .catch((error) => console.error("❌ Camera/Microphone Error:", error));

    const newPeer = new Peer();
    setPeer(newPeer);

    newPeer.on("open", (id) => {
      console.log(`🎯 Peer ID: ${id}`);
      newSocket.send(JSON.stringify({ type: "new-user", peerId: id }));
    });

    newPeer.on("call", (call) => {
      console.log("📞 Answering incoming call...");
      call.answer(localStream);
      call.on("stream", (remoteStream) => {
        console.log("📹 Received Remote Stream");
        addRemoteVideo(call.peer, remoteStream);
      });
    });

    newSocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("📩 WebSocket Message:", data);

      if (data.type === "new-user" && data.peerId !== newPeer.id) {
        console.log(`🔔 New participant joined: ${data.peerId}`);
        callUser(data.peerId);
      }
    }

    return () => {
      newSocket.close();
      newPeer.destroy();
    };
  }, [meetingId]);

  const callUser = (remotePeerId: string) => {
    if (!peer || !localStream) return;
    console.log(`📞 Calling user: ${remotePeerId}`);
    const call = peer.call(remotePeerId, localStream);
    call.on("stream", (remoteStream) => {
      console.log("📹 Received Remote Stream");
      addRemoteVideo(remotePeerId, remoteStream);
    });
  };

  const addRemoteVideo = (peerId: string, stream: MediaStream) => {
    console.log(`📺 Adding video for: ${peerId}`);
    if (!remoteVideosRef.current[peerId]) {
      const videoElement = document.createElement("video");
      videoElement.srcObject = stream;
      videoElement.autoplay = true;
      videoElement.playsInline = true;
      videoElement.classList.add("w-48", "h-32", "rounded-lg", "border");
      document.getElementById("remote-videos")?.appendChild(videoElement);
      remoteVideosRef.current[peerId] = videoElement;
    }
  };

  const copyLink = () => {
    if (meetingLink) {
      navigator.clipboard.writeText(meetingLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const toggleMute = () => {
    if (!myVideoRef.current || !myVideoRef.current.srcObject) return;
  
    const stream = myVideoRef.current.srcObject as MediaStream;
    const audioTracks = stream.getAudioTracks();
  
    if (audioTracks.length > 0) {
      audioTracks[0].enabled = !audioTracks[0].enabled;
      setIsMuted(!audioTracks[0].enabled);
    }
  };
  

  const toggleVideo = () => {
    if (!myVideoRef.current || !myVideoRef.current.srcObject) return;
  
    const stream = myVideoRef.current.srcObject as MediaStream;
    const videoTracks = stream.getVideoTracks();
  
    if (videoTracks.length > 0) {
      videoTracks[0].enabled = !videoTracks[0].enabled;
      setIsVideoOff(!videoTracks[0].enabled);
    }
  };
  

  // ✅ Leave Meeting
  const leaveMeeting = () => {
    if (socket) socket.close();
    if (peer) peer.destroy();
    router.push("/");
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h2 className="text-xl font-bold">Meeting ID: {meetingId}</h2>

      {meetingLink && (
        <div className="flex flex-col items-center space-y-2 mt-4 bg-white p-4 rounded-lg shadow-lg">
          <p className="text-lg font-semibold">Share this link:</p>
          <div className="flex items-center space-x-2 border p-2 rounded-md w-full">
            <span className="truncate w-64">{meetingLink}</span>
            <button
              className="bg-green-500 text-white px-3 py-1 rounded-md hover:bg-green-600"
              onClick={copyLink}
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>
      )}

      <div className="flex space-x-4 mt-4">
        <video ref={myVideoRef} autoPlay muted className="w-48 h-32 border rounded-lg" />
        <div id="remote-videos" className="flex space-x-2"></div>
      </div>

      {/* ✅ Mute, Video & Leave Buttons */}
      <div className="flex space-x-4 mt-6">
        <button
            onClick={toggleMute}
            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
        >
            {isMuted ? "Unmute Mic" : "Mute Mic"}
        </button>

        <button
            onClick={toggleVideo}
            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
        >
            {isVideoOff ? "Turn On Camera" : "Turn Off Camera"}
        </button>

        <button
            onClick={leaveMeeting}
            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
        >
            Leave Call
        </button>
        </div>

    </div>
  );
};

export default MeetingPage;
