import { useRouter } from "next/router";
import { useState, useContext, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { v4 as uuidv4 } from "uuid";
import axios, { AxiosError } from "axios";
import Cookies from "js-cookie";

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();
  const [meetingId, setMeetingId] = useState("");

  useEffect(() => {
    console.log("👤 Current User in Context:", user);
  }, [user]);

  const startMeeting = async () => {
    if (!user) {
        alert("Please log in first.");
        return;
    }

    const token = Cookies.get("token");
    if (!token) {
        alert("Authentication failed. Please log in again.");
        return;
    }

    const newMeetingId = uuidv4(); // Generate a unique meeting ID

    try {
        const res = await axios.post(
            "http://localhost:8000/start-meeting",
            { meeting_id: newMeetingId, username: user.username }, // ✅ Ensure correct fields
            { headers: { Authorization: `Bearer ${token}` } } // ✅ Ensure token is included
        );

        console.log("✅ Meeting Created:", res.data);
        router.push(`/meeting/${res.data.meeting_id}`);
    } catch (error) {
      const axiosError = error as AxiosError;
      console.error("❌ Failed to start meeting:", axiosError.response?.data || axiosError.message);
        alert("Error starting meeting. Please try again.");
    }
};


  // const joinMeeting = () => {
  //   if (!meetingId) {
  //     alert("Enter a valid Meeting ID.");
  //     return;
  //   }
  //   router.push(`/meeting/${meetingId}`);
  // };
  const joinMeeting = async () => {
    try {
      const res = await axios.post("http://localhost:8000/join-meeting", { meetingId });
      console.log("Meeting joined:", res.data);
    } catch (error) {
      console.error("Error joining meeting:", error);
    }
  };
  

  return (
    <div style={{ textAlign: "center", padding: "50px" }}>
      <h1>Welcome to SuperSoul Meetings</h1>
      {user ? (
        <>
          <button onClick={startMeeting} style={{ padding: "10px", fontSize: "16px" }}>
            Start a New Meeting
          </button>
          <div style={{ marginTop: "20px" }}>
            <input
              type="text"
              value={meetingId}
              onChange={(e) => setMeetingId(e.target.value)}
              placeholder="Enter Meeting ID"
            />
            <button onClick={joinMeeting}>Join Meeting</button>
          </div>
        </>
      ) : (
        <>
          <p style={{ color: "red" }}>🚫 You must log in to start or join a meeting.</p>
          <button
            onClick={() => router.push("/login")} // ✅ Redirect to /login
            style={{
              marginTop: "20px",
              padding: "10px 20px",
              fontSize: "16px",
              backgroundColor: "blue",
              color: "white",
              borderRadius: "5px",
              cursor: "pointer",
            }}
          >
            Login
          </button>
        </>
      )}
    </div>
  );
  
}
