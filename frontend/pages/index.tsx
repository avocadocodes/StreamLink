import { useRouter } from "next/router";
import { useState } from "react";
import { v4 as uuidv4 } from "uuid";

const Home = () => {
  const router = useRouter();
  const [meetingId, setMeetingId] = useState("");

  // Function to start a new meeting
  const startMeeting = () => {
    const newMeetingId = uuidv4(); // Generate unique meeting ID
    router.push(`/meeting/${newMeetingId}`); // Redirect to meeting page
  };

  // Function to join an existing meeting
  const joinMeeting = () => {
    if (meetingId.trim()) {
      router.push(`/meeting/${meetingId}`);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <h1 className="text-3xl font-bold mb-6">Welcome to SuperSoul Video Meet</h1>

      <button 
        className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 mb-4"
        onClick={startMeeting}
      >
        Start a New Meeting
      </button>

      <div className="flex space-x-2">
        <input
          type="text"
          placeholder="Enter Meeting ID"
          value={meetingId}
          onChange={(e) => setMeetingId(e.target.value)}
          className="p-2 border border-gray-300 rounded-md"
        />
        <button 
          className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
          onClick={joinMeeting}
        >
          Join Meeting
        </button>
      </div>
    </div>
  );
};

export default Home;
