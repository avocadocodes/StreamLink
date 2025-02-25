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
  const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL;
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
            `${backendURL}/start-meeting`,
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
      const res = await axios.post(`${backendURL}/join-meeting`, { meetingId });
      console.log("Meeting joined:", res.data);
    } catch (error) {
      console.error("Error joining meeting:", error);
    }
  };
  
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <nav className="w-full p-4 flex justify-between items-center bg-white shadow-md">
        <h1 className="text-2xl font-semibold text-black">StreamLink</h1>
        <div>
          {user ? (
            <p className="text-gray-700">Welcome, {user.username}</p>
          ) : (
            <>
              <button
                onClick={() => router.push("login")}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg mr-2"
              >
                Login
              </button>
              <button
                onClick={() => router.push("/register")}
                className="px-4 py-2 bg-green-600 text-white rounded-lg"
              >
                Register
              </button>
            </>
          )}
        </div>
      </nav>
  
      {/* Centered Content */}
      <div className="flex flex-col items-center justify-center flex-1">
        
        {/* ✅ Text is in its own block */}
        <div className="text-center mb-6">
          <h2 className="text-4xl font-bold text-gray-900">
            Video calls and meetings for everyone
          </h2>
          <p className="mt-2 text-gray-600">
            Connect, collaborate, and celebrate with secure and high-quality video calls.
          </p>
        </div>
  
        {/* ✅ Buttons are in a separate row */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={startMeeting}
            className="min-w-[200px] px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition"
          >
            Start a New Meeting
          </button>
  
          <input
            type="text"
            value={meetingId}
            onChange={(e) => setMeetingId(e.target.value)}
            placeholder="Enter a code or link"
            className="px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 w-64"
          />
  
          <button
            onClick={joinMeeting}
            className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 transition"
          >
            Join
          </button>
        </div>
      </div>
    </div>
  );
  
  // return (
  //   <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
  //     <nav className="w-full p-4 flex justify-between items-center bg-white shadow-md">
  //       <h1 className="text-2xl font-semibold text-black">SuperSoul Meet</h1>
  //       <div>
  //         {user ? (
  //           <p className="text-gray-700">Welcome, {user.username}</p>
  //         ) : (
  //           <>
  //           <button
  //             onClick={() => router.push("login")} 
  //             style={{
  //               marginTop: "20px",
  //               padding: "10px 20px",
  //               fontSize: "16px",
  //               backgroundColor: "blue",
  //               color: "white",
  //               borderRadius: "5px",
  //               cursor: "pointer",
  //             }}
  //           >
  //           Login
  //           </button>
  //            <button
  //            onClick={() => router.push("/register")} // ✅ Redirect to Register Page
  //            style={{
  //              padding: "10px 20px",
  //              fontSize: "16px",
  //              backgroundColor: "green",
  //              color: "white",
  //              borderRadius: "5px",
  //              cursor: "pointer",
  //            }}
  //          >
  //            Register
  //          </button>
  //           </>
            
  //         )}
  //       </div>
  //     </nav>
  //     <div className="flex flex-col md:flex-row items-center justify-center flex-1">
  //       <div className="text-center md:text-left md:w-1/2 p-6">
          
  //         <div className="mt-6 flex flex-col md:flex-row items-center justify-center gap-4">
  //         <div className="flex flex-col items-center text-center">
  //           <h2 className="text-4xl font-bold text-gray-900">
  //             Video calls and meetings for everyone
  //           </h2>
  //           <p className="mt-4 text-gray-600">
  //             Connect, collaborate, and celebrate with secure and high-quality video calls.
  //           </p>
  //         </div>
  //         <button
  //           onClick={startMeeting}
  //           className="min-w-[200px] px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition"
  //         >
  //           Start a New Meeting
  //         </button>

  //           <input
  //             type="text"
  //             value={meetingId}
  //             onChange={(e) => setMeetingId(e.target.value)}
  //             placeholder="Enter a code or link"
  //             className="ml-4 px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
  //           />
  //           <button onClick={joinMeeting} className="ml-2 px-4 py-3 bg-green-600 rounded-lg shadow-md hover:bg-green-700 transition">
  //             Join
  //           </button>
  //         </div>
  //       </div>
  //      </div>
  //   </div>
  // );
  
}
